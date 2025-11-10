"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: any;
  height?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  options,
  height = 300,
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              label += `${context.parsed} (${percentage}%)`;
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <Doughnut data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  );
};
