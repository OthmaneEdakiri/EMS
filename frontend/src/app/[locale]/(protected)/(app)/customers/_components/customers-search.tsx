"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface CustomersSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const CustomersSearch = ({ value, onChange }: CustomersSearchProps) => {
  const t = useTranslations("customers");

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
