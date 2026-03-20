"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2Icon,
  PenIcon,
  SaveFloppyIcon,
  CancelIcon,
} from "mage-icons-react/bulk";
import {
  ArrowLeftIcon,
  PlusIcon,
  DownloadIcon,
  ReloadIcon,
} from "mage-icons-react/stroke";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import fetcher from "@/lib/fetcher";
import { post, patch, remove } from "@/lib/apis";
import { toast } from "sonner";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { PersonalizationForm } from "@/components/campaigns/personalization-form";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

function downloadCSV(items, listName) {
  // Collect all unique personalization keys across items
  const personalizationKeys = [
    ...new Set(
      items.flatMap((item) =>
        item.personalization ? Object.keys(item.personalization) : [],
      ),
    ),
  ];

  const headers = [
    "name",
    "email",
    "company",
    "website",
    ...personalizationKeys,
  ];
  const rows = items.map((item) => [
    item.name,
    item.email,
    item.company,
    item.website,
    ...personalizationKeys.map((key) => item.personalization?.[key] || ""),
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${listName || "leads"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ListDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Fetch list info
  const {
    data: list,
    error: listError,
    isLoading: listLoading,
  } = useSWR(`/api/lead-lists/${id}`, fetcher);

  // Fetch list items
  const {
    data: itemsData,
    error: itemsError,
    isLoading: itemsLoading,
  } = useSWR(`/api/lead-lists/${id}/items`, fetcher);

  const items = itemsData?.items || [];

  // --- Edit list name/info ---
  const [editingList, setEditingList] = useState(false);
  const [listForm, setListForm] = useState({});

  const startEditList = () => {
    setListForm({
      name: list?.name || "",
      description: list?.description || "",
      domain: list?.domain || "",
      company: list?.company || "",
    });
    setEditingList(true);
  };

  const { trigger: triggerUpdateList, isMutating: isUpdatingList } =
    useSWRMutation(`/api/lead-lists/${id}`, patch, {
      onSuccess: () => {
        mutate(`/api/lead-lists/${id}`);
        setEditingList(false);
        toast.success("List updated");
      },
      onError: () => toast.error("Failed to update list"),
    });

  // --- Add item ---
  const [addOpen, setAddOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
  });
  const [formError, setFormError] = useState(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [personalization, setPersonalization] = useState({});
  const [personalizeForm, setPersonalizeForm] = useState({
    label: "",
    value: "",
  });

  const { trigger: triggerAddItem, isMutating: isAdding } = useSWRMutation(
    `/api/lead-lists/${id}/items`,
    post,
    {
      onSuccess: () => {
        mutate(`/api/lead-lists/${id}/items`);
        setAddOpen(false);
        setItemForm({ name: "", email: "", company: "", website: "" });
        setPersonalization({});
        setFormError(null);
        toast.success("Lead added");
      },
      onError: () => toast.error("Failed to add lead"),
    },
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      leadSchema.parse(itemForm);
      setFormError(null);
      await triggerAddItem({
        ...itemForm,
        personalization,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.errors[0].message);
      } else {
        setFormError("An error occurred. Please try again.");
      }
    }
  };

  const handlePersonalizationSave = (data) => {
    setPersonalization((prev) => ({
      ...prev,
      [data.label]: data.value,
    }));
    setShowPersonalization(false);
    setPersonalizeForm({ label: "", value: "" });
  };

  const handlePersonalizationCancel = () => {
    setShowPersonalization(false);
    setPersonalizeForm({ label: "", value: "" });
  };

  const handleDeletePersonalization = (labelToDelete) => {
    setPersonalization((prev) => {
      const { [labelToDelete]: _, ...rest } = prev;
      return rest;
    });
  };

  // --- Edit item inline ---
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemForm, setEditItemForm] = useState({});

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemForm({
      name: item.name,
      email: item.email,
      website: item.website,
      company: item.company,
    });
  };

  // --- Delete list ---
  const { trigger: triggerDeleteList, isMutating: isDeletingList } =
    useSWRMutation(`/api/lead-lists/${id}`, (url) => remove(url, { arg: {} }), {
      onSuccess: () => {
        toast.success("List deleted");
        router.push("/lists");
      },
      onError: () => toast.error("Failed to delete list"),
    });

  // --- Sorting ---
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const item = row.original;
          if (editingItemId === item.id) {
            return (
              <Input
                value={editItemForm.name}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, name: e.target.value })
                }
                className="h-8 text-sm"
              />
            );
          }
          return <span className="font-medium">{item.name}</span>;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const item = row.original;
          if (editingItemId === item.id) {
            return (
              <Input
                value={editItemForm.email}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, email: e.target.value })
                }
                className="h-8 text-sm"
              />
            );
          }
          return (
            <span className="text-sm text-gray-600">{item.email || "—"}</span>
          );
        },
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => {
          const item = row.original;
          if (editingItemId === item.id) {
            return (
              <Input
                value={editItemForm.company}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, company: e.target.value })
                }
                className="h-8 text-sm"
              />
            );
          }
          return (
            <span className="text-sm text-gray-600">{item.company || "—"}</span>
          );
        },
      },
      {
        accessorKey: "website",
        header: "Website",
        cell: ({ row }) => {
          const item = row.original;
          if (editingItemId === item.id) {
            return (
              <Input
                value={editItemForm.website}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, website: e.target.value })
                }
                className="h-8 text-sm"
              />
            );
          }
          return (
            <span className="text-sm text-gray-600">{item.website || "—"}</span>
          );
        },
      },
      {
        accessorKey: "personalization",
        header: "Personalization",
        cell: ({ row }) => {
          const item = row.original;
          const entries = item.personalization
            ? Object.entries(item.personalization)
            : [];
          if (entries.length === 0) {
            return <span className="text-sm text-gray-400">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {entries.map(([key, value]) => (
                <span
                  key={key}
                  className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
                >
                  <span className="font-medium">{key}:</span> {value}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          if (editingItemId === item.id) {
            return (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    patch(`/api/lead-lists/${id}/items/${item.id}`, {
                      arg: editItemForm,
                    }).then(() => {
                      mutate(`/api/lead-lists/${id}/items`);
                      setEditingItemId(null);
                      toast.success("Lead updated");
                    });
                  }}
                >
                  <SaveFloppyIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingItemId(null)}
                >
                  <CancelIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => startEditItem(item)}
              >
                <PenIcon className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600"
                onClick={() => {
                  if (confirm("Delete this lead?")) {
                    remove(`/api/lead-lists/${id}/items/${item.id}`, {
                      arg: {},
                    }).then(() => {
                      mutate(`/api/lead-lists/${id}/items`);
                      toast.success("Lead deleted");
                    });
                  }
                }}
              >
                <Trash2Icon className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [editingItemId, editItemForm, id],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isLoading = listLoading || itemsLoading;
  const hasError = listError || itemsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ReloadIcon className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-red-50">
          <p className="text-lg font-medium text-red-600">Error loading list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/lists">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeftIcon className="w-[18px] h-[18px]" />
            </Button>
          </Link>
          <div>
            {editingList ? (
              <div className="space-y-3">
                <Input
                  value={listForm.name}
                  onChange={(e) =>
                    setListForm({ ...listForm, name: e.target.value })
                  }
                  className="text-xl font-bold h-10"
                  placeholder="List name"
                />
                <Input
                  value={listForm.description}
                  onChange={(e) =>
                    setListForm({ ...listForm, description: e.target.value })
                  }
                  placeholder="Description"
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    value={listForm.domain}
                    onChange={(e) =>
                      setListForm({ ...listForm, domain: e.target.value })
                    }
                    placeholder="Domain"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={listForm.company}
                    onChange={(e) =>
                      setListForm({ ...listForm, company: e.target.value })
                    }
                    placeholder="Company"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={isUpdatingList}
                    onClick={() => triggerUpdateList(listForm)}
                  >
                    {isUpdatingList ? (
                      <ReloadIcon className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <SaveFloppyIcon className="w-3.5 h-3.5 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingList(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{list?.name}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={startEditList}
                  >
                    <PenIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {list?.description && (
                  <p className="text-gray-600 mt-1">{list.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  {list?.domain && (
                    <span className="text-xs text-gray-400">{list.domain}</span>
                  )}
                  {list?.company && (
                    <span className="text-xs text-gray-400">
                      {list.company}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {items.length} lead{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={items.length === 0}
            onClick={() => {
              downloadCSV(items, list?.name);
              toast.success(`Exported ${items.length} leads`);
            }}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white">
              <DialogHeader>
                <DialogTitle>Add Lead</DialogTitle>
                <DialogDescription>
                  Add a new lead to this list
                </DialogDescription>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {!showPersonalization ? (
                  <motion.form
                    initial={{ x: "10%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-10%" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    onSubmit={handleAddSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="item-name">Name</Label>
                        <Input
                          id="item-name"
                          name="name"
                          placeholder="John Doe"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              name: e.target.value,
                            })
                          }
                          required
                          className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-email">Email</Label>
                        <Input
                          id="item-email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={itemForm.email}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              email: e.target.value,
                            })
                          }
                          required
                          className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-company">Company</Label>
                          <Input
                            id="item-company"
                            name="company"
                            placeholder="Acme Inc"
                            value={itemForm.company}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                company: e.target.value,
                              })
                            }
                            className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-website">Website</Label>
                          <Input
                            id="item-website"
                            name="website"
                            placeholder="https://example.com"
                            value={itemForm.website}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                website: e.target.value,
                              })
                            }
                            className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>
                      </div>

                      {formError && (
                        <div className="text-red-700 text-sm border border-black p-2">
                          {formError}
                        </div>
                      )}

                      {/* Personalization Section */}
                      {Object.entries(personalization).length > 0 && (
                        <div className="mt-4 p-4 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <h4 className="text-sm font-medium mb-2">
                            Personalizations:
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(personalization).map(
                              ([label, value]) => (
                                <div
                                  key={label}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <div className="flex gap-2">
                                    <span className="font-medium">
                                      {label}:
                                    </span>
                                    <span>{value}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      handleDeletePersonalization(label)
                                    }
                                    type="button"
                                  >
                                    <Trash2Icon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPersonalization(true)}
                        >
                          Add Personalization
                        </Button>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setAddOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAdding}>
                        {isAdding ? "Adding..." : "Add Lead"}
                      </Button>
                    </DialogFooter>
                  </motion.form>
                ) : (
                  <PersonalizationForm
                    onSave={handlePersonalizationSave}
                    onCancel={handlePersonalizationCancel}
                    form={personalizeForm}
                    setForm={setPersonalizeForm}
                  />
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isDeletingList}
            onClick={() => {
              if (confirm("Delete this list and all its items?")) {
                triggerDeleteList();
              }
            }}
          >
            {isDeletingList ? (
              <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2Icon className="w-4 h-4 mr-2" />
            )}
            Delete List
          </Button>
        </div>
      </div>

      {/* Items table */}
      <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg">No leads yet</p>
            <p className="text-gray-500 mt-1">
              Add leads manually or use the Lead Finder
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
