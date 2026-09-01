"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";

interface InvoicesEmptyStateProps {
  isSearchActive: boolean;
}

export const InvoicesEmptyState = ({
  isSearchActive,
}: InvoicesEmptyStateProps) => {
  const t = useTranslations("invoices");

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FileText className="mb-4 size-12 text-muted-foreground/50" />
      <h3 className="mb-1 text-lg font-semibold">
        {isSearchActive ? t("search.noResults") : t("empty.title")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {isSearchActive ? "" : t("empty.description")}
      </p>
    </div>
  );
};
