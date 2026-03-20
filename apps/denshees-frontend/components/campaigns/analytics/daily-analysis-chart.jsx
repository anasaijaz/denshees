"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { DateTime } from "luxon";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Helper function to convert date strings to readable format
function formatDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year.slice(-2)}`;
}

const DailyAnalysisChart = ({ campaignId, dailyData, todayData }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0)
      return;

    // Extract dates and format them
    const labels = dailyData.map((item) => formatDate(item.date));

    // Add today's data if available
    if (todayData?.data) {
      labels.push("Today");
    }

    // Extract emails opened data
    const emailsOpened = dailyData.map((item) => item.opened || 0);
    if (todayData?.data?.opened_sum !== undefined) {
      emailsOpened.push(todayData.data.opened_sum);
    }

    // Extract emails sent data
    const emailsSent = dailyData.map((item) => item.emails_sent || 0);
    if (todayData?.data?.stages_sum !== undefined) {
      emailsSent.push(todayData.data.stages_sum);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: "Emails Opened",
          data: emailsOpened,
          borderColor: "rgb(0, 0, 0)",
          backgroundColor: "rgba(147, 197, 253, 0.5)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Emails Sent",
          data: emailsSent,
          borderColor: "rgb(0, 0, 0)",
          backgroundColor: "rgba(255, 204, 102, 0.5)",
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }, [dailyData, todayData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      {chartData.labels.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default DailyAnalysisChart;
