"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExclamationTriangleIcon, TrashIcon } from "mage-icons-react/bulk";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { patch } from "@/lib/apis";

const DangerZone = ({ campaignId }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Setup mutation for deleting campaign
  const { trigger: deleteCampaign } = useSWRMutation(
    `/api/campaign/${campaignId}`,
    patch,
    {
      onSuccess: () => {
        toast.success("Campaign deleted successfully");
        router.push("/campaigns");
      },
      onError: () => {
        toast.error("Failed to delete campaign");
        setIsDeleting(false);
        setShowConfirm(false);
      },
    },
  );

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== "delete") {
      toast.error("Please type 'delete' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCampaign({ deleted: true });
    } catch (error) {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="border border-red-300 bg-red-50 p-6 shadow-[4px_4px_0px_0px_rgba(255,0,0,0.3)]">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-red-600 mb-6">
            Actions in this section can lead to data loss and cannot be undone.
            Please proceed with caution.
          </p>

          {!showConfirm ? (
            <div className="flex justify-between items-center border-t border-red-200 pt-4">
              <div>
                <h3 className="font-medium text-red-700">Delete Campaign</h3>
                <p className="text-sm text-red-600">
                  This will permanently delete this campaign and all its data.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                className="bg-white text-red-600 border-red-600 hover:bg-red-50"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Campaign
              </Button>
            </div>
          ) : (
            <div className="border-t border-red-200 pt-4 space-y-4">
              <p className="font-medium text-red-700">
                Please type &apos;delete&apos; to confirm that you want to
                delete this campaign:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-2 border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type 'delete' to confirm"
              />
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || confirmText !== "delete"}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DangerZone;
