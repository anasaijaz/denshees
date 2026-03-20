"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import Builder from "@/components/campaigns/builder/builder";
import "reactflow/dist/style.css";
import LeadFinderChat from "@/components/lead-finder-chat";

export default function CampaignBuilderPage() {
  const params = useParams();
  const campaignId = params.id;

  const { data: campaignData, isLoading } = useSWR(
    campaignId ? `/api/campaign/${campaignId}` : null,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center h-[400px]">
        <div className="border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-medium">Loading campaign templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {campaignData && <Builder campaign={campaignId} />}
    </div>
  );
}
