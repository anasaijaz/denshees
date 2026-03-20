"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import {
  MessageSquareIcon,
  EyeIcon,
  MultiplyCircleIcon,
} from "mage-icons-react/bulk";

const iconMap = {
  replied: MessageSquareIcon,
  opened: EyeIcon,
  noReply: MultiplyCircleIcon,
};

const colorMap = {
  replied: {
    bg: "bg-green-100",
    border: "border-green-600",
    text: "text-green-800",
    shadow: "shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]",
    percentBg: "bg-green-200",
  },
  opened: {
    bg: "bg-blue-100",
    border: "border-blue-600",
    text: "text-blue-800",
    shadow: "shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]",
    percentBg: "bg-blue-200",
  },
  noReply: {
    bg: "bg-gray-100",
    border: "border-gray-600",
    text: "text-gray-800",
    shadow: "shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]",
    percentBg: "bg-gray-200",
  },
};

const OutcomeNode = ({ data }) => {
  const { label, count, type, percentage, totalContacts } = data;
  const Icon = iconMap[type] || MessageSquareIcon;
  const colors = colorMap[type] || colorMap.noReply;

  return (
    <div
      className={`px-4 py-3 rounded-none border-2 ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} min-w-[150px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-black !border-2 !border-white w-3 h-3"
      />

      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <div className="font-bold text-sm">{label}</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
      </div>

      {/* Percentage bar */}
      <div className="mt-2 pt-2 border-t border-current/20">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>of {totalContacts} leads</span>
          <span className="font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-white/50 rounded-sm overflow-hidden">
          <div
            className={`h-full ${colors.percentBg} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(OutcomeNode);
