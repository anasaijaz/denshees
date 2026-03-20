"use client";

import {
  DotsHorizontalSquareIcon,
  EditIcon,
  TrashIcon,
} from "mage-icons-react/bulk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSWRMutation from "swr/mutation";
import { remove } from "@/lib/apis";

const DataTableActionsMenu = ({ obj }) => {
  const { id, name, campaignId, onEdit, onDelete } = obj || {};

  // Setup mutation for deleting a lead
  const { trigger: deleteLead } = useSWRMutation("/api/lead/delete", remove, {
    onSuccess: () => {
      toast.success(`Lead ${name} removed successfully`);
      if (onDelete) onDelete(id);
    },
    onError: () => {
      toast.error(`Failed to remove lead ${name}`);
    },
  });

  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    } else {
      toast.info(`Editing lead ${name}`);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      if (onDelete) {
        onDelete(id);
      } else {
        deleteLead({ lead: id });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <DotsHorizontalSquareIcon className="w-4 h-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit Lead
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete Lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DataTableActionsMenu;
