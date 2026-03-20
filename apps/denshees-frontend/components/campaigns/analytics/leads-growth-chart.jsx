"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year.slice(-2)}`;
}

const LeadsGrowthChart = ({ growthData }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [avgPerDay, setAvgPerDay] = useState(0);

  useEffect(() => {
    if (!growthData?.data || growthData.data.length === 0) return;

    const labels = growthData.data.map((item) => formatDate(item.date));
    const counts = growthData.data.map((item) => item.count);

    // Compute cumulative totals
    const cumulative = [];
    counts.reduce((acc, val, i) => {
      cumulative[i] = acc + val;
      return cumulative[i];
    }, 0);

    // Compute average per day
    const avg =
      counts.length > 0
        ? counts.reduce((sum, c) => sum + c, 0) / counts.length
        : 0;

    setAvgPerDay(avg);

    setChartData({
      labels,
      datasets: [
        {
          label: "Leads Added",
          data: counts,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Cumulative Total",
          data: cumulative,
          type: "line",
          borderColor: "rgb(100, 100, 100)",
          backgroundColor: "rgba(100, 100, 100, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "rgb(100, 100, 100)",
          borderWidth: 2,
        },
      ],
    });
  }, [growthData]);

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
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || "",
        },
      },
      annotation: {
        annotations: {
          avgLine: {
            type: "line",
            yMin: avgPerDay,
            yMax: avgPerDay,
            borderColor: "rgba(59, 130, 246, 0.7)",
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
              display: true,
              content: `Avg: ${avgPerDay.toFixed(1)} / day`,
              position: "end",
              backgroundColor: "rgba(59, 130, 246, 0.85)",
              color: "#fff",
              font: { size: 11, weight: "bold" },
              padding: { top: 3, bottom: 3, left: 6, right: 6 },
              borderRadius: 4,
            },
          },
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
        <Bar data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No leads data available</p>
        </div>
      )}
    </div>
  );
};

export default LeadsGrowthChart;
