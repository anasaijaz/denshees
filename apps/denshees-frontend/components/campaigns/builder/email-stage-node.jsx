"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import {
  EmailIcon,
  AeroplaneIcon,
  MessageSquareIcon,
} from "mage-icons-react/bulk";

const EmailStageNode = ({ data }) => {
  const {
    label,
    stage,
    isSelected,
    onClick,
    contactCount,
    replyCount,
    totalContacts,
  } = data;

  // Calculate percentages
  const contactPercentage =
    totalContacts > 0 ? Math.round((contactCount / totalContacts) * 100) : 0;
  const replyPercentage =
    contactCount > 0 ? Math.round((replyCount / contactCount) * 100) : 0;

  return (
    <div
      className={`px-4 py-3 rounded-none border-2 ${
        isSelected
          ? "bg-black text-white border-black"
          : "bg-white text-black border-black"
      } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[220px] cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
      onClick={() => onClick(stage)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-black !border-2 !border-white w-3 h-3"
      />

      <div className="flex items-center gap-2">
        <EmailIcon className="w-[18px] h-[18px]" />
        <div className="flex-1">
          <div className="font-bold">{label}</div>
          <div className="text-xs truncate max-w-[150px]">
            {stage.subject || "No subject"}
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div
        className={`mt-2 pt-2 border-t ${isSelected ? "border-white/30" : "border-black/20"} space-y-1`}
      >
        {/* Contacts at this stage */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <AeroplaneIcon className="w-3 h-3" />
            Contacts
          </span>
          <span className="font-bold">
            {contactCount ?? 0}
            <span
              className={`ml-1 text-[10px] ${isSelected ? "text-white/70" : "text-gray-500"}`}
            >
              ({contactPercentage}%)
            </span>
          </span>
        </div>

        {/* Replies at this stage */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <MessageSquareIcon className="w-3 h-3 text-green-700" />
            <span className={isSelected ? "text-green-400" : "text-green-700"}>
              Replies
            </span>
          </span>
          <span
            className={`font-bold ${isSelected ? "text-green-400" : "text-green-700"}`}
          >
            {replyCount ?? 0}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-black !border-2 !border-white w-3 h-3"
      />
    </div>
  );
};

export default memo(EmailStageNode);
