"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ExclamationCircleIcon,
  PauseIcon,
  PlayIcon,
} from "mage-icons-react/bulk";
import { ArrowLeftIcon } from "mage-icons-react/stroke";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/button";
import StatusChip from "@/components/ui/status-chip";
import useCampaignStore from "@/store/campaign.store";
import fetcher from "@/lib/fetcher";
import { patch } from "@/lib/apis";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CampaignLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const campaignId = params.id;

  const { currentCampaign, setCurrentCampaign } = useCampaignStore();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch campaign data using SWR
  const {
    data: campaignData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(campaignId ? `/api/campaign/${campaignId}` : null, fetcher, {
    onSuccess: (data) => {
      setCurrentCampaign(data);
    },
  });

  // Setup mutation for updating campaign status
  const { trigger: updateStatus } = useSWRMutation(
    `/api/campaign/${campaignId}`,
    patch,
    {
      // Optimistic update
      onMutate: async (newData) => {
        // Store the current campaign data to roll back if needed
        const previousCampaign = currentCampaign;

        // Optimistically update the UI
        setCurrentCampaign({ ...currentCampaign, status: newData.status });

        // Return the previous campaign data for rollback
        return { previousCampaign };
      },
      // Handle errors and rollback if needed
      onError: (error, data, context) => {
        // Rollback to the previous campaign data
        setCurrentCampaign(context.previousCampaign);
        toast.error(
          `Failed to ${data.status === "RUNNING" ? "start" : "pause"} campaign`,
        );
      },
      // Revalidate after successful mutation
      onSuccess: (data, variables) => {
        toast.success(
          `Campaign ${
            variables.status === "RUNNING" ? "started" : "paused"
          } successfully`,
        );
        mutate(); // Refresh campaign data
      },
    },
  );

  // Check if campaign has emails
  const hasEmails =
    currentCampaign?.campaignEmailCredentials &&
    currentCampaign.campaignEmailCredentials.length > 0;

  // Handle campaign status toggle
  const handleStatusToggle = async () => {
    if (isUpdatingStatus || !currentCampaign) return;

    // Don't allow starting the campaign if there are no emails
    if (!hasEmails && currentCampaign.status !== "RUNNING") {
      toast.error("Cannot start campaign: No email accounts configured");
      return;
    }

    setIsUpdatingStatus(true);

    const newStatus =
      currentCampaign.status === "RUNNING" ? "PAUSED" : "RUNNING";

    try {
      await updateStatus({ status: newStatus });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Define tabs
  const tabs = [
    { name: "Leads", href: `/campaigns/${campaignId}`, tourId: "tour-tab-leads" },
    { name: "CRM", href: `/campaigns/${campaignId}/crm`, tourId: "tour-tab-crm" },
    { name: "Builder", href: `/campaigns/${campaignId}/builder`, tourId: "tour-tab-builder" },
    { name: "Analytics", href: `/campaigns/${campaignId}/analytics`, tourId: "tour-tab-analytics" },
    { name: "Settings", href: `/campaigns/${campaignId}/settings` },
  ];

  // Check if a tab is active
  const isTabActive = (href) => pathname === href;

  if (isLoading) return null;

  // Determine if the start button should be disabled
  const isStartButtonDisabled =
    isUpdatingStatus ||
    !currentCampaign ||
    (!hasEmails && currentCampaign.status !== "RUNNING");

  return (
    <div className="space-y-6">
      <div className="header">
        {/* Back button and campaign title */}
        <div className="flex items-center space-x-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeftIcon className="w-[18px] h-[18px]" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading
              ? "Loading..."
              : currentCampaign?.title || "Campaign Details"}
          </h1>
          {currentCampaign && <StatusChip status={currentCampaign.status} />}
        </div>

        {/* Error message */}
        {error && (
          <div className="border border-red-300 bg-red-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-red-800">Failed to load campaign details</p>
          </div>
        )}

        {/* Tabs and action button */}
        <div className="border-black">
          <div className="flex items-center justify-between">
            <div className="flex border-b border-black">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  id={tab.tourId}
                  href={tab.href}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                    isTabActive(tab.href)
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </div>

            {currentCampaign && (
              <div className="mr-4">
                {!hasEmails && currentCampaign.status !== "RUNNING" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            disabled={true}
                            variant="default"
                            className="opacity-70"
                          >
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Start Campaign
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center">
                          <ExclamationCircleIcon className="w-3.5 h-3.5 mr-2 text-amber-500" />
                          <p>Configure email accounts in Settings first</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={handleStatusToggle}
                    disabled={isUpdatingStatus}
                    variant={
                      currentCampaign.status === "RUNNING"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {currentCampaign.status === "RUNNING" ? (
                      <>
                        <PauseIcon className="w-4 h-4 mr-2" />
                        Pause Campaign
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Start Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* No emails warning */}
        {currentCampaign &&
          !hasEmails &&
          currentCampaign.status !== "RUNNING" && (
            <div className="mt-4 border border-amber-300 bg-amber-50 p-3 rounded-none flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-2 text-amber-500" />
              <p className="text-sm text-amber-800">
                This campaign has no email accounts configured. Go to{" "}
                <Link
                  href={`/campaigns/${campaignId}/settings`}
                  className="underline font-medium"
                >
                  Settings
                </Link>{" "}
                to add email accounts before starting the campaign.
              </p>
            </div>
          )}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
