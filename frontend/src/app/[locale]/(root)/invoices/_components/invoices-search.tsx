"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface InvoicesSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const InvoicesSearch = ({ value, onChange }: InvoicesSearchProps) => {
  const t = useTranslations("invoices");

  return (
    <Input
      type="search"
      placeholder={t("search.placeholder")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-sm"
    />
  );
};
