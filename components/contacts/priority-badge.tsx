import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";

const VARIANTS: Record<Priority, { label: string; className: string }> = {
  high: {
    label: "High",
    className:
      "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-transparent",
  },
  low: {
    label: "Low",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variant = VARIANTS[priority];
  return <Badge className={variant.className}>{variant.label}</Badge>;
}
