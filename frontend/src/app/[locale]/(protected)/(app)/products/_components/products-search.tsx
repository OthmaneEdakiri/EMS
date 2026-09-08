"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface ProductsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProductsSearch = ({ value, onChange }: ProductsSearchProps) => {
  const t = useTranslations("products");

  return (
    <div className="flex items-center gap-2">
      <Search className="size-4 text-muted-foreground" />
      <Input
        placeholder={t("search.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};
