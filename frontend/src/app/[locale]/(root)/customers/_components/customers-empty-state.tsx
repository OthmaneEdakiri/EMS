"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomersEmptyStateProps {
  isSearchActive: boolean;
}

export const CustomersEmptyState = ({
  isSearchActive,
}: CustomersEmptyStateProps) => {
  const t = useTranslations("customers");

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Users className="size-10 text-muted-foreground/50" />
      <h3 className="text-sm font-medium">
        {isSearchActive ? t("search.noResults") : t("empty.title")}
      </h3>
      <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
    </div>
  );
};
