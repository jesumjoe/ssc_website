import { cn } from "@/lib/utils";

export type ConcernStatus = "pending" | "reviewing" | "escalated" | "resolved" | "invalid";

interface StatusBadgeProps {
  status: ConcernStatus;
  className?: string;
}

const statusConfig: Record<ConcernStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending Review",
    className: "status-pending",
  },
  reviewing: {
    label: "Under Review",
    className: "status-reviewing",
  },
  escalated: {
    label: "Escalated",
    className: "status-escalated",
  },
  resolved: {
    label: "Resolved",
    className: "status-resolved",
  },
  invalid: {
    label: "Invalid",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

interface SeverityBadgeProps {
  level: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export const SeverityBadge = ({ level, className }: SeverityBadgeProps) => {
  return (
    <span
      className={cn(
        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border severity-${level}`,
        className
      )}
    >
      Severity: {level}/5
    </span>
  );
};
