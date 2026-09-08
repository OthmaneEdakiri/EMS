"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface CustomersPaginationProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
}

export const CustomersPagination = ({
  pageIndex,
  pageCount,
  onPageChange,
}: CustomersPaginationProps) => {
  const t = useTranslations("customers");

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {t("pagination.page")} {pageIndex + 1} {t("pagination.of")}{" "}
        {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          {t("pagination.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
};
