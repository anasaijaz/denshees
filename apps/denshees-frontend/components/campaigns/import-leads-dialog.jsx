"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useSWRMutation from "swr/mutation";
import { post } from "@/lib/apis";
import { mutate } from "swr";
import { z } from "zod";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  InformationCircleIcon,
  UserIcon,
  CancelIcon,
  Trash2Icon,
  LayoutGridIcon,
} from "mage-icons-react/bulk";
import { PlusIcon } from "mage-icons-react/stroke";

const csvSchema = z.array(
  z
    .object({
      name: z.string().min(0),
      email: z.string().email("Invalid email"),
    })
    .passthrough(),
);

// Inline editable cell — click to edit, blur/enter to save
const EditableCell = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 px-1.5 py-0 text-sm border-black shadow-none focus-visible:ring-1 focus-visible:ring-black rounded-none"
      />
    );
  }

  return (
    <div
      onClick={() => {
        setEditing(true);
        setDraft(value);
      }}
      className="cursor-text min-h-[28px] flex items-center px-1.5 text-sm hover:bg-gray-50 rounded-none select-none truncate"
      title={value || "Click to edit"}
    >
      {value || <span className="text-gray-400 italic">Empty</span>}
    </div>
  );
};

const ImportLeadsDialog = ({ open = false, setOpen, campaign }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState(["name", "email"]);
  const [error, setError] = useState(null);
  const [duplicateEmails, setDuplicateEmails] = useState([]);
  const [newColName, setNewColName] = useState("");

  const { trigger, isMutating } = useSWRMutation(
    "/api/contacts/import-file",
    post,
    {
      onSuccess: () => {
        setOpen(false);
        mutate(`/api/contacts/paginatedapi?campaign=${campaign}`);
        toast.success(`${data.length} leads imported successfully`);
        if (duplicateEmails.length > 0) {
          toast(`Skipped ${duplicateEmails.length} duplicate(s).`, {
            description: "Duplicate emails were not imported.",
          });
        }
      },
      onError: () => {
        toast.error("Error importing leads");
      },
    },
  );

  const isDuplicate = (email) => {
    return data.some((contact) => contact.email === email);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data;

          const validation = csvSchema.safeParse(parsed);
          if (validation.success) {
            const uniqueContacts = [];
            const duplicates = [];

            const allCols = Object.keys(parsed[0] || {});
            const colSet = new Set(["name", "email", ...allCols]);
            setColumns([...colSet]);

            parsed.forEach((contact) => {
              if (isDuplicate(contact.email)) {
                duplicates.push(contact.email);
              } else {
                uniqueContacts.push({ ...contact });
              }
            });

            setDuplicateEmails(duplicates);
            setData((prevData) => [...prevData, ...uniqueContacts]);
            setError(null);
          } else {
            setError(
              "Invalid CSV format. Make sure your file has 'name' and 'email' columns.",
            );
          }
        },
        error: () => {
          setError("Error parsing the CSV file");
        },
      });
    }
  };

  const handleCellChange = (rowIndex, col, newValue) => {
    setData((prev) =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, [col]: newValue } : row,
      ),
    );
  };

  const handleDeleteRow = (rowIndex) => {
    setData((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const handleAddColumn = () => {
    const col = newColName.trim().toLowerCase();
    if (!col) return;
    if (columns.includes(col)) {
      toast.error(`Column "${col}" already exists`);
      return;
    }
    setColumns((prev) => [...prev, col]);
    // Add empty value for the new column in every existing row
    setData((prev) => prev.map((row) => ({ ...row, [col]: "" })));
    setNewColName("");
  };

  const handleAddRow = () => {
    const emptyRow = {};
    columns.forEach((col) => (emptyRow[col] = ""));
    setData((prev) => [...prev, emptyRow]);
  };

  const handleClear = () => {
    setData([]);
    setColumns(["name", "email"]);
  };

  const handleImportContacts = async () => {
    const currentData = data.filter((row) =>
      columns.some((col) => row[col] && String(row[col]).trim()),
    );

    if (currentData.length === 0) {
      toast.error("No contacts to import");
      return;
    }

    try {
      const exportData = currentData.map((row) => {
        const { name, email, ...rest } = row;
        return {
          name: name || "",
          email: email || "",
          personalization: JSON.stringify(rest),
        };
      });

      const csvString = Papa.unparse(exportData);
      const csvBlob = new Blob([csvString], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", csvBlob, "contacts.csv");
      formData.append("campaign", campaign);
      await trigger(formData);
      setData([]);
      setColumns(["name", "email"]);
    } catch (error) {
      toast.error("Error importing data");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[900px] bg-white max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>Import leads from a CSV file</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* CSV Upload — hidden once data is loaded */}
          {data.length === 0 && (
            <div className="border-2 border-dashed border-black rounded-none p-6 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mx-auto mb-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="text-sm text-gray-700">
                Upload a CSV file with name and email columns
              </p>
            </div>
          )}

          {error && (
            <div className="border border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {data.length === 0 && (
            <div className="text-left text-sm flex gap-2 items-center justify-between p-4 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5" />
                Preview of imported contacts will be shown here
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleAddRow}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add row
              </Button>
            </div>
          )}

          {/* Editable data table */}
          {data.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm">
                  <span className="font-medium">{data.length}</span> leads will
                  be imported
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddColumn();
                      }}
                      placeholder="Column name"
                      className="h-8 w-28 text-xs border-black rounded-none shadow-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={handleAddColumn}
                      disabled={!newColName.trim()}
                    >
                      <LayoutGridIcon className="w-3.5 h-3.5" /> Add column
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleAddRow}
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add row
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleClear}
                  >
                    <CancelIcon className="w-3.5 h-3.5" /> Clear
                  </Button>
                </div>
              </div>

              <div className="border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-black z-10">
                      <TableRow className="hover:bg-black border-black">
                        <TableHead className="text-white font-semibold text-xs w-10 text-center">
                          #
                        </TableHead>
                        {columns.map((col) => (
                          <TableHead
                            key={col}
                            className="text-white font-semibold text-xs"
                          >
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                          </TableHead>
                        ))}
                        <TableHead className="text-white font-semibold text-xs w-10 sticky right-0 bg-black" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-black/20 hover:bg-gray-50 group/row"
                        >
                          <TableCell className="text-center text-xs text-gray-400 font-mono p-1">
                            {rowIndex + 1}
                          </TableCell>
                          {columns.map((col) => (
                            <TableCell key={col} className="p-0.5">
                              <EditableCell
                                value={row[col] || ""}
                                onChange={(val) =>
                                  handleCellChange(rowIndex, col, val)
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="p-1 sticky right-0 bg-white group-hover/row:bg-gray-50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRow(rowIndex)}
                            >
                              <Trash2Icon className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Info and Warnings — hidden when data is loaded */}
          {data.length === 0 && (
            <div className="border border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2">
              <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">CSV Format Requirements</p>
                <ul className="text-sm list-disc pl-5 mt-1">
                  <li>
                    CSV file must have columns named &apos;name&apos; and
                    &apos;email&apos;
                  </li>
                  <li>
                    Additional columns will be imported as personalization
                    fields
                  </li>
                  <li>Click any cell to edit it before importing</li>
                  <li>
                    <a
                      href="/Sample.csv"
                      download
                      className="underline font-medium"
                    >
                      Download sample CSV template
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-black pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImportContacts}
            disabled={data.length === 0 || isMutating}
          >
            {isMutating ? "Importing..." : "Import Leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsDialog;
