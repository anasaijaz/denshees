"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({
  totalContacts,
  verifiedContacts,
  emailsSent,
  emailsOpened,
  emailsReplied,
}) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Calculate values for the pie chart
    // We'll show the breakdown of campaign status

    // Calculate the number of contacts at each stage
    const replied = emailsReplied;
    const opened = emailsOpened - replied; // Opened but didn't reply
    const sent = emailsSent - emailsOpened; // Sent but not opened
    const verified = verifiedContacts - emailsSent; // Verified but no email sent yet
    const unverified = totalContacts - verifiedContacts; // Not verified yet

    setChartData({
      labels: [
        "Replied",
        "Opened (No Reply)",
        "Sent (Not Opened)",
        "Verified (No Email)",
        "Unverified",
      ],
      datasets: [
        {
          data: [replied, opened, sent, verified, unverified],
          backgroundColor: [
            "rgba(34, 197, 94, 0.7)", // Green for replied
            "rgba(59, 130, 246, 0.7)", // Blue for opened
            "rgba(147, 197, 253, 0.7)", // Light blue for sent
            "rgba(209, 213, 219, 0.7)", // Gray for verified
            "rgba(229, 231, 235, 0.7)", // Light gray for unverified
          ],
          borderColor: [
            "rgba(0, 0, 0, 1)",
            "rgba(0, 0, 0, 1)",
            "rgba(0, 0, 0, 1)",
            "rgba(0, 0, 0, 1)",
            "rgba(0, 0, 0, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [
    totalContacts,
    verifiedContacts,
    emailsSent,
    emailsOpened,
    emailsReplied,
  ]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      {totalContacts > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default PieChart;
