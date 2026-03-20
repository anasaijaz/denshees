"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import CampaignSettingsForm from "@/components/campaigns/settings/campaign-settings-form";
import EmailSettings from "@/components/campaigns/settings/email-settings";
import DangerZone from "@/components/campaigns/settings/danger-zone";

export default function CampaignSettingsPage() {
  const params = useParams();
  const campaignId = params.id;

  const {
    data: campaignData,
    error,
    isLoading,
  } = useSWR(campaignId ? `/api/campaign/${campaignId}` : null, fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-medium">Loading campaign settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-red-800">Failed to load campaign settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Campaign Settings</h1>
        <p className="text-gray-600">
          Configure your campaign settings and preferences.
        </p>
      </div>

      {/* Campaign Settings Form */}
      <CampaignSettingsForm campaign={campaignId} campaignData={campaignData} />

      {/* Email Settings */}
      <EmailSettings campaignId={campaignId} />

      {/* Danger Zone */}
      <DangerZone campaignId={campaignId} />
    </div>
  );
}
