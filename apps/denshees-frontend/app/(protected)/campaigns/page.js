"use client";

import { useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { PlusIcon, ReloadIcon } from "mage-icons-react/stroke";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusChip from "@/components/ui/status-chip";
import CampaignDropdown from "@/components/campaigns/campaign-dropdown";
import { Switch } from "@/components/ui/switch";
import fetcher from "@/lib/fetcher";
import { patch } from "@/lib/apis";
import { toast } from "sonner";

// Define update functions for SWR mutations
async function updateCampaignStatus(url, { arg }) {
  const { campaign, newStatus } = arg;
  return patch(url, {
    arg: {
      status: newStatus,
    },
  });
}

async function deleteCampaign(url, { arg }) {
  const { campaign } = arg;
  return patch(url, {
    arg: {
      deleted: true,
    },
  });
}

// Helper function to determine if a campaign is in an active state
function isActiveStatus(status) {
  return ["RUNNING", "VERIFYING", "PAUSING"].includes(status);
}

// Helper function to determine if a campaign status can be toggled
function canToggleStatus(status) {
  return ["RUNNING", "PAUSED", "PENDING", "COMPLETED", "FAILED"].includes(
    status,
  );
}

// Helper function to get the next status when toggling
function getNextStatus(currentStatus) {
  if (isActiveStatus(currentStatus)) {
    return "PAUSED";
  } else {
    return "RUNNING";
  }
}

export default function CampaignsPage() {
  const { data, error, isLoading } = useSWR("/api/campaign", fetcher);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize Fuse.js with campaign data and options for fuzzy searching
  const fuseOptions = {
    keys: ["title", "desc"], // Fields to search through
    threshold: 0.4, // Controls fuzziness level
  };

  const campaigns = data?.items || [];
  const fuse = new Fuse(campaigns, fuseOptions);

  // Perform fuzzy search based on the search query
  const filteredCampaigns =
    searchQuery.trim() === ""
      ? campaigns // If no search query, show all campaigns
      : fuse.search(searchQuery).map((result) => result.item); // Show only filtered results

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your email campaigns</p>
        </div>
        <Link href="/campaigns/create">
          <Button id="tour-new-campaign-btn">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-lg font-medium">Loading campaigns...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-block border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-red-50">
              <p className="text-lg font-medium text-red-600">
                Error loading campaigns
              </p>
              <p className="text-sm text-red-500 mt-1">{error.toString()}</p>
            </div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg">No campaigns found</p>
            <p className="text-gray-500 mt-1">
              {searchQuery.trim() !== ""
                ? "Try a different search term"
                : "Create your first campaign to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for each campaign row to properly handle SWR mutations
function CampaignRow({ campaign }) {
  // Create a unique key for this specific campaign
  const statusMutationKey = `/api/campaign/${campaign.id}`;
  const deleteMutationKey = `/api/campaign/${campaign.id}`;

  // Set up mutations for this specific campaign
  const { trigger: triggerStatusUpdate, isMutating: isUpdatingStatus } =
    useSWRMutation(statusMutationKey, updateCampaignStatus);

  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    deleteMutationKey,
    deleteCampaign,
  );

  const handleStatusToggle = async (event) => {
    // Check if the status can be toggled
    if (!canToggleStatus(campaign.status)) {
      toast(`Cannot toggle campaign in ${campaign.status} status`, {
        style: {
          backgroundColor: "white",
        },
      });
      return;
    }

    const newStatus = getNextStatus(campaign.status);
    const statusAction = newStatus === "RUNNING" ? "started" : "paused";

    try {
      // Trigger the mutation
      await triggerStatusUpdate({ campaign, newStatus });

      // Revalidate the campaigns list
      mutate("/api/campaign");

      // Show success message
      toast(`Campaign ${statusAction} successfully`, {
        style: {
          backgroundColor: "white",
        },
      });
    } catch (error) {
      console.error(`Failed to ${statusAction} campaign:`, error);
      toast(`Failed to ${statusAction} campaign`, {
        style: {
          backgroundColor: "white",
        },
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Trigger the mutation
      await triggerDelete({ campaign });

      // Revalidate the campaigns list
      mutate("/api/campaign");

      // Show success message
      toast("Campaign deleted successfully", {
        style: {
          backgroundColor: "white",
        },
      });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast("Failed to delete campaign", {
        style: {
          backgroundColor: "white",
        },
      });
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActiveStatus(campaign.status)}
              onCheckedChange={handleStatusToggle}
              disabled={!canToggleStatus(campaign.status)}
              aria-label={`Toggle ${campaign.title} campaign status`}
            />
          </div>
          <Link href={`/campaigns/${campaign.id}`} className="flex-1">
            <h3 className="font-medium text-sm hover:underline">
              {campaign.title}
            </h3>
            {campaign.desc && (
              <p className="text-sm text-gray-500">{campaign.desc}</p>
            )}
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StatusChip status={campaign.status} />

        <CampaignDropdown
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
