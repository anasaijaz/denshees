"use client";

import { DownloadIcon } from "mage-icons-react/stroke";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { get } from "@/lib/apis";

function downloadCSV(leads, campaignId) {
  const headers = [
    "Name",
    "Email",
    "Status",
    "Stage",
    "Opened",
    "Last Sent At",
  ];
  const rows = leads.map((lead) => [
    lead.name,
    lead.email,
    lead.status,
    lead.stage || 0,
    lead.opened ? "Yes" : "No",
    lead.sent_at || "",
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-${campaignId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportLeadsButton({
  campaignId,
  searchQuery,
  sentAtSort,
  stageFilter,
  hideCompleted,
}) {
  const { trigger, isMutating } = useSWRMutation(
    `/api/contacts/export`,
    (url) =>
      get(
        `${url}?campaign=${campaignId}&search=${searchQuery}&sentAtSort=${sentAtSort}&stage=${stageFilter}&hideCompleted=${hideCompleted}`,
      ),
    {
      onSuccess: (data) => {
        const allLeads = data.items || [];
        if (!allLeads.length) {
          toast.error("No leads to export");
          return;
        }
        downloadCSV(allLeads, campaignId);
        toast.success(`Exported ${allLeads.length} leads`);
      },
      onError: () => {
        toast.error("Failed to export leads");
      },
    },
  );

  return (
    <Button
      variant="outline"
      disabled={isMutating}
      onClick={() => {
        toast.info("Exporting leads...");
        trigger();
      }}
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      {isMutating ? "Exporting..." : "Export"}
    </Button>
  );
}
