"use client";
import {
  CoinAIcon,
  StarsCIcon,
  ExclamationTriangleIcon,
} from "mage-icons-react/bulk";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CreditsDisplay({ user }) {
  const totalCredits = user?.credits || 0;
  const aiCredits = user?.aiCredits || 0;

  const isLowCredits = totalCredits < 20;
  const isLowAI = aiCredits < 20;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-1 px-2 py-1 border text-xs font-mono font-medium ${
                isLowCredits
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-black bg-white text-black"
              }`}
            >
              <CoinAIcon className="h-3 w-3" />
              {totalCredits.toLocaleString()}
            </div>
          </TooltipTrigger>
          <TooltipContent className="border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p>Email Credits</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-1 px-2 py-1 border text-xs font-mono font-medium ${
                isLowAI
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-black bg-white text-black"
              }`}
            >
              <StarsCIcon className="h-3 w-3" />
              {aiCredits.toLocaleString()}
            </div>
          </TooltipTrigger>
          <TooltipContent className="border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p>AI Credits</p>
          </TooltipContent>
        </Tooltip>

        {(isLowCredits || isLowAI) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent className="border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-64">
              <p className="text-xs">
                Credits running low.
                {isLowCredits && ` Email: ${totalCredits}`}
                {isLowCredits && isLowAI && ","}
                {isLowAI && ` AI: ${aiCredits}`}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
