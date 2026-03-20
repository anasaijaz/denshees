"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  UserPlusIcon,
  FileUploadIcon,
  FilterIcon,
  SearchIcon,
} from "mage-icons-react/bulk";
import { ArrowsAllDirectionIcon } from "mage-icons-react/stroke";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useCampaignStore from "@/store/campaign.store";
import StatusChip from "@/components/ui/status-chip";
import DataTableActionsMenu from "@/components/campaigns/data-table-actions-menu";
import { DataTable } from "@/components/campaigns/data-table";
import ImportLeadsDialog from "@/components/campaigns/import-leads-dialog";
import AddLeadDialog from "@/components/campaigns/add-lead-dialog";
import EditLeadDialog from "@/components/campaigns/edit-lead-dialog";
import ExportLeadsButton from "@/components/campaigns/export-leads-button";
import LeadsGrowthChart from "@/components/campaigns/analytics/leads-growth-chart";
import fetcher from "@/lib/fetcher";
import { remove } from "@/lib/apis";
import { DateTime } from "luxon";

export default function CampaignLeadsPage() {
  const params = useParams();
  const campaignId = params.id;

  const {
    leads,
    totalLeads,
    currentPage,
    totalPages,
    searchQuery,
    currentCampaign,
    setLeadsData,
    setPage,
    setSearchQuery,
  } = useCampaignStore();

  const [search, setSearch] = useState(searchQuery || "");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [editLeadDialogOpen, setEditLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sentAtSort, setSentAtSort] = useState("NEWEST_FIRST");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch leads growth data
  const { data: growthData } = useSWR(
    campaignId ? `/api/contacts/leads-growth?campaign=${campaignId}` : null,
    fetcher,
  );

  // Fetch leads using SWR
  const {
    data: leadsData,
    error,
    isLoading,
    mutate,
  } = useSWR(
    campaignId
      ? `/api/contacts/paginatedapi?campaign=${campaignId}&page=${currentPage}&search=${searchQuery}&sentAtSort=${sentAtSort}&stage=${stageFilter}&hideCompleted=${hideCompleted}`
      : null,
    fetcher,
    {
      onSuccess: (data) => {
        setLeadsData(data);
      },
    },
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPage(page);
  };

  // Setup mutation for deleting a lead
  const { trigger: deleteLead } = useSWRMutation(
    "/api/lead/delete/",
    (url, args) => {
      return remove(`${url}/${args.arg}`, args);
    },
    {
      onSuccess: () => {
        toast.success("Lead deleted successfully");
        mutate(); // Refresh the leads data
      },
      onError: () => {
        toast.error("Failed to delete lead");
      },
    },
  );

  // Handle view timeline
  const handleViewTimeline = useCallback((leadId) => {
    // Navigate to timeline view or open modal
    console.log(`View timeline for lead: ${leadId}`);
  }, []);

  // Handle edit lead
  const handleEditLead = useCallback(
    (leadId) => {
      // Find the lead data from the current leads
      const leadToEdit = leads.find((lead) => lead.id === leadId);
      if (leadToEdit) {
        setSelectedLead(leadToEdit);
        setEditLeadDialogOpen(true);
      }
    },
    [leads],
  );

  // Handle delete lead
  const handleDeleteLead = useCallback(
    async (leadId) => {
      try {
        await deleteLead(leadId);
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    },
    [deleteLead],
  );

  // Fetch company chips for the entire campaign
  const { data: companyChips = [] } = useSWR(
    campaignId ? `/api/contacts/companies?campaign=${campaignId}` : null,
    fetcher,
  );

  // Format data for the table
  const formattedData = useMemo(() => {
    console.log({ leads });
    return leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      status: lead.status,
      stage: lead.stage || 0,
      opened: lead.opened ? "Yes" : "No",
      sent_from: lead.expand?.cred?.username || "-",
      sent_at:
        lead.status === "PENDING"
          ? "-"
          : lead.sent_at
            ? DateTime.fromJSDate(new Date(lead.sent_at)).toRelative()
            : "Not sent",
      actions: {
        id: lead.id,
        name: lead.name,
        campaignId: campaignId,
        onViewTimeline: handleViewTimeline,
        onEdit: handleEditLead,
        onDelete: handleDeleteLead,
      },
    }));
  }, [leads, campaignId, handleViewTimeline, handleEditLead, handleDeleteLead]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              Name
              <ArrowsAllDirectionIcon className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "name",
        id: "name",
      },
      {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              Email
              <ArrowsAllDirectionIcon className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "email",
        id: "email",
        size: 200,
      },
      {
        header: "Status",
        accessorKey: "status",
        id: "status",
        cell: ({ row }) => {
          const status = row.getValue("status");
          return <StatusChip status={status} />;
        },
      },
      {
        header: "Emails Sent",
        accessorKey: "stage",
        id: "stage",
        cell: ({ row }) => {
          const currentStage = row.getValue("stage") || 0;
          const totalStages = currentCampaign?.maxStageCount || 5;
          const progress = (currentStage / totalStages) * 100;
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden border border-black">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {currentStage}/{totalStages}
              </span>
            </div>
          );
        },
      },
      {
        header: "Emails Opened",
        accessorKey: "opened",
        id: "opened",
        cell: ({ row }) => {
          const opened = row.getValue("opened");
          const isTrackingEnabled =
            currentCampaign?.isTrackingEnabled !== false;
          return (
            <div className="text-center">
              {isTrackingEnabled ? opened : "-"}
            </div>
          );
        },
      },
      {
        header: "Sent From",
        accessorKey: "sent_from",
        id: "sent_from",
        cell: ({ row }) => {
          const val = row.getValue("sent_from");
          if (!val || val === "-")
            return <span className="text-gray-400">-</span>;
          return (
            <span
              className="inline-block text-[10px] leading-none text-white bg-black rounded-full px-2 py-1 truncate max-w-[140px]"
              title={val}
            >
              {val}
            </span>
          );
        },
      },
      {
        header: "Last Sent at",
        accessorKey: "sent_at",
        id: "sent_at",
      },
      {
        header: "Actions",
        accessorKey: "actions",
        id: "actions",
        cell: ({ row }) => {
          const obj = row.getValue("actions");
          return <DataTableActionsMenu obj={obj} />;
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-sm items-center space-x-2"
        >
          <Input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit">
            <SearchIcon className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>

        <div className="flex space-x-2">
          {/* Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Set your lead filtering preferences.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="sent-at-sort">Last Sent At</Label>
                    <Select
                      value={sentAtSort}
                      onValueChange={(value) => {
                        setSentAtSort(value);
                        handleFilterChange();
                      }}
                    >
                      <SelectTrigger className="col-span-2 h-8 border-black">
                        <SelectValue placeholder="Sort by sent date" />
                      </SelectTrigger>
                      <SelectContent className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <SelectItem value="NEWEST_FIRST">
                          Newest first
                        </SelectItem>
                        <SelectItem value="OLDEST_FIRST">
                          Oldest first
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="stage-filter">Stage</Label>
                    <Select
                      value={stageFilter}
                      onValueChange={(value) => {
                        setStageFilter(value);
                        handleFilterChange();
                      }}
                    >
                      <SelectTrigger className="col-span-2 h-8 border-black">
                        <SelectValue placeholder="Filter by stage" />
                      </SelectTrigger>
                      <SelectContent className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <SelectItem value="ALL">All stages</SelectItem>
                        {Array.from(
                          {
                            length: (currentCampaign?.maxStageCount || 5) + 1,
                          },
                          (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              Stage {i}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <Label htmlFor="hide-completed">Hide completed</Label>
                    <button
                      id="hide-completed"
                      type="button"
                      role="switch"
                      aria-checked={hideCompleted}
                      onClick={() => {
                        setHideCompleted(!hideCompleted);
                        handleFilterChange();
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-black transition-colors ${
                        hideCompleted ? "bg-black" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-3 w-3 rounded-full bg-white transition-transform ${
                          hideCompleted ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSentAtSort("NEWEST_FIRST");
                      setStageFilter("ALL");
                      setHideCompleted(false);
                      handleFilterChange();
                    }}
                  >
                    Reset
                  </Button>
                  <Button size="sm" onClick={() => setFilterOpen(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={() => setAddLeadDialogOpen(true)}>
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileUploadIcon className="w-4 h-4 mr-2" />
            Import
          </Button>
          <ExportLeadsButton
            campaignId={campaignId}
            searchQuery={searchQuery}
            sentAtSort={sentAtSort}
            stageFilter={stageFilter}
            hideCompleted={hideCompleted}
          />
        </div>
      </div>

      {/* Leads Growth Chart */}
      <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
        <h3 className="text-lg font-semibold mb-2">Leads Added Over Time</h3>
        <LeadsGrowthChart growthData={growthData} />
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-red-300 bg-red-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-red-800">Failed to load leads</p>
        </div>
      )}

      {/* Data table */}
      <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[400px]">
        <DataTable
          columns={columns}
          data={formattedData}
          pageCount={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        {totalLeads > 0 && (
          <p>
            Showing {Math.min((currentPage - 1) * 15 + 1, totalLeads)} to{" "}
            {Math.min(currentPage * 15, totalLeads)} of {totalLeads} leads
          </p>
        )}
      </div>

      {/* Import Dialog */}
      <ImportLeadsDialog
        open={importDialogOpen}
        setOpen={setImportDialogOpen}
        campaign={campaignId}
      />

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addLeadDialogOpen}
        setOpen={setAddLeadDialogOpen}
        campaign={campaignId}
      />

      {/* Edit Lead Dialog */}
      <EditLeadDialog
        open={editLeadDialogOpen}
        setOpen={setEditLeadDialogOpen}
        lead={selectedLead}
        campaign={campaignId}
      />
    </div>
  );
}
