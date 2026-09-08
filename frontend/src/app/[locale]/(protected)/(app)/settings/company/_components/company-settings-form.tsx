"use client";

import { Form } from "@base-ui/react/form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { type CompanySettings } from "../types";
import { CompanyInfoCard } from "./company-info-card";
import { CompanyLogoCard } from "./company-logo-card";
import { CompanyCurrencyCard } from "./company-currency-card";

interface CompanySettingsFormProps {
  settings: CompanySettings;
  saving: boolean;
  logoPreview: string | null;
  onLogoChange: (file: File) => void;
  onRemoveLogo: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

export const CompanySettingsForm = ({
  settings,
  saving,
  logoPreview,
  onLogoChange,
  onRemoveLogo,
  onSubmit,
}: CompanySettingsFormProps) => {
  const t = useTranslations("companySettings");

  return (
    <Form onFormSubmit={onSubmit} className="flex flex-col gap-6">
      <CompanyInfoCard
        name={settings.name}
        invoicePrefix={settings.invoice_prefix}
      />

      <CompanyLogoCard
        logoPreview={logoPreview}
        onLogoChange={onLogoChange}
        onRemoveLogo={onRemoveLogo}
      />

      <CompanyCurrencyCard
        currency={settings.currency}
        locale={settings.locale}
        hasInvoices={settings.has_invoices}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader />}
          {t("save")}
        </Button>
      </div>
    </Form>
  );
};
