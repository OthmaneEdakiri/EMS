"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  onToggleForm: () => void;
}

export const ProductsHeader = ({ onToggleForm }: ProductsHeaderProps) => {
  const t = useTranslations("products");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Button onClick={onToggleForm}>
        <Package className="size-4" />
        {t("addProduct")}
      </Button>
    </div>
  );
};
