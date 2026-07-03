import { Badge } from "@/components/ui/Badge";

const STATUS_STYLES: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
  initiated:      { variant: "info",     label: "Initiated" },
  under_review:   { variant: "warning",  label: "Under Review" },
  rectified:      { variant: "info",     label: "Rectified" },
  rejected_final: { variant: "error",    label: "Rejected (Final)" },
  appealed:       { variant: "warning",  label: "Appealed" },
  completed:      { variant: "success",  label: "Completed" },
  expired:        { variant: "neutral",  label: "Expired" },
};

export function RectificationStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={style.variant}>{style.label}</Badge>;
}
