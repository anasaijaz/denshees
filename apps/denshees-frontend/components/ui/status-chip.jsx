import { cn } from "@/lib/utils";

// Status color mapping with pastel colors
const statusColors = {
  PENDING: "bg-yellow-50 text-yellow-800 border-yellow-300",
  FAILED: "bg-red-50 text-red-800 border-red-300",
  COMPLETED: "bg-green-50 text-green-800 border-green-300",
  PAUSED: "bg-gray-50 text-gray-800 border-gray-300",
  RUNNING: "bg-blue-50 text-blue-800 border-blue-300",
  PAUSING: "bg-purple-50 text-purple-800 border-purple-300",
  VERIFYING: "bg-indigo-50 text-indigo-800 border-indigo-300",
};

// Map status codes to human-readable text
const statusLabels = {
  PENDING: "Pending",
  FAILED: "Failed",
  COMPLETED: "Completed",
  PAUSED: "Paused",
  RUNNING: "Running",
  PAUSING: "Pausing",
  VERIFYING: "Verifying",
};

const StatusChip = ({ status, size = "md", className }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  // Get the human-readable label or use the original status if not mapped
  const label = statusLabels[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]",
        statusColors[status] || "bg-gray-50 text-gray-800 border-gray-300",
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusChip;
