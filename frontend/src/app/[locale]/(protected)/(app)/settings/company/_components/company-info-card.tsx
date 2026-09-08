"use client";

import { Field } from "@base-ui/react/field";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface CompanyInfoCardProps {
  name: string;
  invoicePrefix: string;
}

export const CompanyInfoCard = ({
  name,
  invoicePrefix,
}: CompanyInfoCardProps) => {
  const t = useTranslations("companySettings");

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("companyInfo.title")}</h2>
      </div>
      <div className="flex flex-col gap-4">
        <Field.Root
          name="name"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t("validation.nameRequired");
            if (value.length > 100)
              return t("validation.nameMaxLength");
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("companyInfo.name.label")}
          </Field.Label>
          <Input
            type="text"
            defaultValue={name}
            placeholder={t("companyInfo.name.placeholder")}
          />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        <Field.Root
          name="invoice_prefix"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t("validation.prefixRequired");
            if (value.length > 20)
              return t("validation.prefixMaxLength");
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("companyInfo.invoicePrefix.label")}
          </Field.Label>
          <Input
            type="text"
            defaultValue={invoicePrefix}
            placeholder={t("companyInfo.invoicePrefix.placeholder")}
          />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>
      </div>
    </div>
  );
};
