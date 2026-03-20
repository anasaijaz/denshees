"use client";

import { useEffect, useRef } from "react";

const FunnelChart = ({
  totalContacts,
  verifiedContacts,
  emailsSent,
  emailsOpened,
  emailsReplied,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Define funnel stages
    const stages = [
      { label: "Total Leads", value: totalContacts, color: "#e5e7eb" },
      { label: "Verified", value: verifiedContacts, color: "#bfdbfe" },
      { label: "Emails Sent", value: emailsSent, color: "#93c5fd" },
      { label: "Emails Opened", value: emailsOpened, color: "#60a5fa" },
      { label: "Replies", value: emailsReplied, color: "#3b82f6" },
    ];

    // Calculate dimensions
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    const stageHeight = height / stages.length;

    // Draw funnel
    const maxValue = Math.max(1, totalContacts);

    stages.forEach((stage, index) => {
      const y = padding + index * stageHeight;
      const widthPercentage = Math.max(0.1, stage.value / maxValue);
      const stageWidth = width * widthPercentage;
      const x = (canvas.width - stageWidth) / 2;

      // Draw stage rectangle
      ctx.fillStyle = stage.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.rect(x, y, stageWidth, stageHeight - 10);
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = "#000000";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${stage.label}: ${stage.value}`,
        canvas.width / 2,
        y + stageHeight / 2 - 5
      );
    });
  }, [
    totalContacts,
    verifiedContacts,
    emailsSent,
    emailsOpened,
    emailsReplied,
  ]);

  return (
    <div className="w-full h-[300px] border border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default FunnelChart;
