"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmailIcon, Trash2Icon } from "mage-icons-react/bulk";
import { PlusIcon } from "mage-icons-react/stroke";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";
import { patch } from "@/lib/apis";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import CreateSMTP from "@/components/campaigns/settings/create-smtp";
import { Checkbox } from "@/components/ui/checkbox";

const EmailSettings = ({ campaignId }) => {
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch available email accounts
  const {
    data: emailAccounts,
    isLoading: emailsLoading,
    mutate: refreshEmails,
  } = useSWR("/api/google_apps", fetcher);

  // Fetch currently selected emails for this campaign
  const { data: selectedEmailsData, isLoading: selectedEmailsLoading } = useSWR(
    campaignId ? `/api/campaign/${campaignId}/selected-emails` : null,
    fetcher,
    {
      onSuccess: (data) => {
        if (data && Array.isArray(data)) {
          setSelectedEmails(data.map((email) => email.id));
        }
      },
    },
  );

  // Setup mutation for updating campaign emails
  const { trigger: updateCampaignEmails, isMutating } = useSWRMutation(
    `/api/campaign/${campaignId}`,
    patch,
    {
      onSuccess: () => {
        toast.success("Email settings updated successfully");
      },
      onError: () => {
        toast.error("Failed to update email settings");
      },
    },
  );

  // Setup mutation for deleting email accounts
  const { trigger: deleteEmailAccount, isMutating: isDeleting } =
    useSWRMutation(
      "/api/google_apps/delete",
      async (url, { arg }) => {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(arg),
        });

        if (!response.ok) {
          throw new Error("Failed to delete email account");
        }

        return response.json();
      },
      {
        onSuccess: () => {
          toast.success("Email account deleted successfully");
          refreshEmails();
        },
        onError: () => {
          toast.error("Failed to delete email account");
        },
      },
    );

  const handleEmailToggle = (emailId) => {
    setSelectedEmails((prev) => {
      if (prev.includes(emailId)) {
        return prev.filter((id) => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      await updateCampaignEmails({
        emails: selectedEmails,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId, e) => {
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this email account?")) {
      try {
        await deleteEmailAccount({ id: emailId });

        // If the deleted email was selected, remove it from selected emails
        if (selectedEmails.includes(emailId)) {
          setSelectedEmails((prev) => prev.filter((id) => id !== emailId));
        }
      } catch (error) {
        console.error("Error deleting email account:", error);
      }
    }
  };

  if (emailsLoading || selectedEmailsLoading) {
    return (
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading email accounts...</p>
        </div>
      </div>
    );
  }

  const emails = emailAccounts || [];
  const isSaveDisabled = selectedEmails.length === 0 || loading;

  return (
    <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-xl font-bold mb-6">Email Accounts</h2>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          Select the email accounts you want to use for this campaign. Emails
          will be sent from these accounts in rotation.
        </p>

        {emails.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-none p-6 text-center">
            <EmailIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No email accounts
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add an email account to use in your campaigns
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Setup Email
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`border p-4 ${
                  selectedEmails.includes(email.id)
                    ? "border-black bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-gray-200"
                } cursor-pointer transition-all`}
                onClick={() => handleEmailToggle(email.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={selectedEmails.includes(email.id)} />
                    {/* <input
                      type="checkbox"
                      checked={selectedEmails.includes(email.id)}
                      onChange={() => {}}
                      className="h-4 w-4 border-gray-300 rounded"
                    /> */}
                    <div>
                      <p className="font-medium">{email.username}</p>
                      <p className="text-sm text-gray-500">
                        Daily limit: {email.dailyLimit} emails
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-6">
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                <PlusIcon className="mr-2 h-4 w-4" />
                Setup Email
              </Button>

              <Button
                onClick={handleSaveEmailSettings}
                disabled={isSaveDisabled}
              >
                {isMutating ? "Saving..." : "Save Email Settings"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Setup Email Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Setup Email Account</DialogTitle>
          </DialogHeader>
          <CreateSMTP />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailSettings;
