"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export const InvoicesHeader = () => {
  const t = useTranslations("invoices");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Link href="/invoices/create">
        <Button>
          <Plus className="size-4" />
          {t("createInvoice")}
        </Button>
      </Link>
    </div>
  );
};
