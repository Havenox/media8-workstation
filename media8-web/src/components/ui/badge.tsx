import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { OrderStatus, UserRole } from "@/types/api";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground border-border",
        // Status variants
        pending: "border-warning/30 bg-warning/10 text-warning",
        "in-progress": "border-info/30 bg-info/10 text-info",
        "in-review": "border-accent/30 bg-accent/10 text-accent",
        "changes-requested": "border-destructive/30 bg-destructive/10 text-destructive",
        approved: "border-success/30 bg-success/10 text-success",
        // Role variants
        admin: "border-wine-vibrant/30 bg-wine-vibrant/10 text-wine-vibrant",
        client: "border-info/30 bg-info/10 text-info",
        editor: "border-success/30 bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Helper to get status badge variant
const statusVariantMap: Record<OrderStatus, BadgeProps["variant"]> = {
  Pending: "pending",
  InProgress: "in-progress",
  InReview: "in-review",
  ChangesRequested: "changes-requested",
  Approved: "approved",
};

function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const statusLabels: Record<OrderStatus, string> = {
    Pending: "Pendente",
    InProgress: "Em Progresso",
    InReview: "Em Revisão",
    ChangesRequested: "Alterações",
    Approved: "Aprovado",
  };

  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {statusLabels[status]}
    </Badge>
  );
}

// Helper to get role badge variant
const roleVariantMap: Record<UserRole, BadgeProps["variant"]> = {
  Admin: "admin",
  Client: "client",
  Editor: "editor",
};

function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const roleLabels: Record<UserRole, string> = {
    Admin: "Admin",
    Client: "Cliente",
    Editor: "Editor",
  };

  return (
    <Badge variant={roleVariantMap[role]} className={className}>
      {roleLabels[role]}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, RoleBadge };
