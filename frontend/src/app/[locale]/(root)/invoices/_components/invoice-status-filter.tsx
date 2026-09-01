"use client";

import { useTranslations } from "next-intl";

interface InvoiceStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  "all",
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

const statusColors: Record<string, string> = {
  all: "bg-muted text-muted-foreground",
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const statusActiveColors: Record<string, string> = {
  all: "bg-primary text-primary-foreground",
  draft: "bg-gray-600 text-white",
  sent: "bg-blue-600 text-white",
  partially_paid: "bg-amber-600 text-white",
  paid: "bg-green-600 text-white",
  overdue: "bg-red-600 text-white",
  cancelled: "bg-muted-foreground text-white",
};

export const InvoiceStatusFilter = ({
  value,
  onChange,
}: InvoiceStatusFilterProps) => {
  const t = useTranslations("invoices");

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === status ? statusActiveColors[status] : statusColors[status]
          }`}
        >
          {t(`status.${status}`)}
        </button>
      ))}
    </div>
  );
};
