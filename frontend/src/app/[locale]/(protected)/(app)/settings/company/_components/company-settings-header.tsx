"use client";

import { useTranslations } from "next-intl";

export const CompanySettingsHeader = () => {
  const t = useTranslations("companySettings");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  );
};
