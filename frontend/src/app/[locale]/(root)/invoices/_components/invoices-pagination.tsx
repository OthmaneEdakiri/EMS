"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface InvoicesPaginationProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export const InvoicesPagination = ({
  pageIndex,
  pageCount,
  onPageChange,
}: InvoicesPaginationProps) => {
  const t = useTranslations("invoices");

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {t("pagination.page")} {pageIndex + 1} {t("pagination.of")} {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          {t("pagination.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
};
