"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface CustomersHeaderProps {
  onToggleForm: () => void;
}

export const CustomersHeader = ({ onToggleForm }: CustomersHeaderProps) => {
  const t = useTranslations("customers");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Button onClick={onToggleForm}>
        <UserPlus className="size-4" />
        {t("addCustomer")}
      </Button>
    </div>
  );
};
