/** @type {import('react-doctor').Config} */
const config = {
  ignore: {
    // shadcn/ui primitives — generated patterns (variants exports, recharts shim, etc.)
    files: ["src/components/ui/**"],
    overrides: [
      // Loaded via next/dynamic in project-analytics.tsx; leaf module still imports recharts.
      {
        files: ["src/features/dev-board/components/analytics-charts.tsx"],
        rules: ["react-doctor/prefer-dynamic-import"],
      },
      // Loaded via next/dynamic in monitor-detail.tsx / monitor-table-row.tsx.
      {
        files: [
          "src/features/uptime-monitor/components/latency-chart.tsx",
          "src/features/uptime-monitor/components/monitor-sparkline.tsx",
        ],
        rules: ["react-doctor/prefer-dynamic-import"],
      },
    ],
  },
};

export default config;
