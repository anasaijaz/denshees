"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import AnalyticsDashboard from "@/components/campaigns/analytics/analytics-dashboard";

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const campaignId = params.id;

  const { data: campaignData, isLoading: campaignLoading } = useSWR(
    campaignId ? `/api/campaign/${campaignId}` : null,
    fetcher
  );

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-medium">Loading campaign analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsDashboard campaignId={campaignId} campaign={campaignData} />
    </div>
  );
}
