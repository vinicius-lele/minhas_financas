import { Progress, Tooltip } from "antd";

export function GoalProgress({ current, target }: { current: number; target: number }) {
  const percent = Math.max(0, Math.min(100, (current / (target || 1)) * 100));
  return (
    <Tooltip title={`${percent.toFixed(0)}%`}>
      <Progress
        percent={Number(percent.toFixed(0))}
        status="active"
        size="small"
        showInfo={false}
        strokeColor={{ from: "#2563eb", to: "#60a5fa" }}
      />
    </Tooltip>
  );
}
