"use client";

import { useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EmailProgressBar = ({
  totalEmails = 100,
  sentEmails = 0,
  openedEmails = 0,
  repliedEmails = 0,
  children,
  animate = true,
}) => {
  const sentRef = useRef(null);
  const openedRef = useRef(null);
  const repliedRef = useRef(null);

  // Calculate percentages with a minimum to ensure visibility
  const sentPercentage = Math.max((sentEmails / totalEmails) * 100, 0.5);
  const openedPercentage = Math.max((openedEmails / totalEmails) * 100, 0.5);
  const repliedPercentage = Math.max((repliedEmails / totalEmails) * 100, 0.5);

  // Animate the progress bars on mount if animation is enabled
  useEffect(() => {
    if (!animate) {
      // If animation is disabled, set widths immediately
      if (sentRef.current) sentRef.current.style.width = `${sentPercentage}%`;
      if (openedRef.current)
        openedRef.current.style.width = `${openedPercentage}%`;
      if (repliedRef.current)
        repliedRef.current.style.width = `${repliedPercentage}%`;
      return;
    }

    if (sentRef.current) {
      sentRef.current.style.transition = "width 1s ease-out";
      sentRef.current.style.width = "0%";

      setTimeout(() => {
        if (sentRef.current) sentRef.current.style.width = `${sentPercentage}%`;
      }, 100);
    }

    if (openedRef.current) {
      openedRef.current.style.transition = "width 1.2s ease-out";
      openedRef.current.style.width = "0%";

      setTimeout(() => {
        if (openedRef.current)
          openedRef.current.style.width = `${openedPercentage}%`;
      }, 200);
    }

    if (repliedRef.current) {
      repliedRef.current.style.transition = "width 1.4s ease-out";
      repliedRef.current.style.width = "0%";

      setTimeout(() => {
        if (repliedRef.current)
          repliedRef.current.style.width = `${repliedPercentage}%`;
      }, 300);
    }
  }, [sentPercentage, openedPercentage, repliedPercentage, animate]);

  return (
    <div className="relative w-full p-4 border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex items-center">
      {/* Background grid pattern for e-ink feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIHN0cm9rZT0iI2VlZWVlZSIgc3Ryb2tlLXdpZHRoPSIxIiBjeD0iMTAiIGN5PSIxMCIgcj0iOSIvPjwvZz48L3N2Zz4=')] opacity-10"></div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={sentRef}
              className="h-full absolute left-0 top-0 bg-gray-200 border-r border-gray-400 z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoM3YzSDB6TTMgM2gzdjNIM3oiIGZpbGw9IiNkZGQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==')]"
              style={{ width: animate ? "0%" : `${sentPercentage}%` }}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-white border border-black">
            <p className="text-sm font-mono">Emails sent: {sentEmails}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={openedRef}
              className="h-full absolute left-0 top-0 bg-gray-300 border-r border-gray-500 z-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoNnYzSDB6TTAgM2g2djNIMHoiIGZpbGw9IiNjY2MiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==')]"
              style={{ width: animate ? "0%" : `${openedPercentage}%` }}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-white border border-black">
            <p className="text-sm font-mono">Emails opened: {openedEmails}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={repliedRef}
              className="h-full absolute left-0 top-0 bg-gray-400 border-r border-gray-600 z-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoNnY2SDB6IiBmaWxsPSIjYWFhIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=')]"
              style={{ width: animate ? "0%" : `${repliedPercentage}%` }}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-white border border-black">
            <p className="text-sm font-mono">Emails replied: {repliedEmails}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="relative z-40 w-full flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 mr-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoM3YzSDB6TTMgM2gzdjNIM3oiIGZpbGw9IiNkZGQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==')]"></div>
              <span className="text-xs font-mono">Sent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoNnYzSDB6TTAgM2g2djNIMHoiIGZpbGw9IiNjY2MiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==')]"></div>
              <span className="text-xs font-mono">Opened</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoNnY2SDB6IiBmaWxsPSIjYWFhIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=')]"></div>
              <span className="text-xs font-mono">Replied</span>
            </div>
          </div>
          <div className="mt-2 text-sm font-mono">
            {sentEmails}/{totalEmails} emails processed
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// Example usage component
export function EmailProgressExample() {
  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4 font-mono">Campaign Progress</h2>
      <EmailProgressBar
        totalEmails={100}
        sentEmails={75}
        openedEmails={45}
        repliedEmails={12}
      >
        <div className="text-right">
          <div className="text-lg font-bold font-mono">75%</div>
          <div className="text-xs font-mono">Complete</div>
        </div>
      </EmailProgressBar>
    </div>
  );
}

export default EmailProgressBar;
