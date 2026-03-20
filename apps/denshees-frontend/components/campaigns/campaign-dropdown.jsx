"use client";
import {
  DotsSquareIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
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

const CampaignDropdown = ({ campaignId, campaignTitle, onDelete }) => {
  const handleAction = (action) => (e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Prevent event bubbling

    switch (action) {
      case "start":
        toast.success(`Started campaign: ${campaignTitle}`);
        break;
      case "pause":
        toast.success(`Paused campaign: ${campaignTitle}`);
        break;
      case "edit":
        toast.info(`Editing campaign: ${campaignTitle}`);
        break;
      case "duplicate":
        toast.success(`Duplicated campaign: ${campaignTitle}`);
        break;
      case "delete":
        toast.error(`Deleted campaign: ${campaignTitle}`);
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
          <DotsSquareIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          <TrashIcon className="w-4 h-4 mr-2" />
          Delete Campaign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CampaignDropdown;
