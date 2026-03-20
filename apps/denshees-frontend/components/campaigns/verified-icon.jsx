import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  CheckCircleIcon,
  MultiplyCircleIcon,
  ExclamationCircleIcon,
} from "mage-icons-react/bulk";

const VerifiedIcon = ({
  verified,
  verificationMessage,
  verificationResponse,
}) => {
  // Status can be "VERIFIED", "FAILED", "PENDING", or null/undefined
  let icon = null;
  let tooltipText = "";
  let iconColor = "";

  if (verified === "VERIFIED") {
    icon = <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    tooltipText = verificationMessage || "Email verified";
    iconColor = "text-green-600";
  } else if (verified === "FAILED") {
    icon = <MultiplyCircleIcon className="h-4 w-4 text-red-600" />;
    tooltipText = verificationMessage || "Verification failed";
    iconColor = "text-red-600";
  } else if (verified === "PENDING") {
    icon = <ExclamationCircleIcon className="h-4 w-4 text-yellow-600" />;
    tooltipText = "Verification in progress";
    iconColor = "text-yellow-600";
  } else {
    // No verification status
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${iconColor}`}>{icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
          {verificationResponse && (
            <p className="text-xs mt-1">{verificationResponse}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedIcon;
