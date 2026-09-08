"use client";

import { Field } from "@base-ui/react/field";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertIcon } from "@/components/ui/alert";

const CURRENCIES = [
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
];

interface CompanyCurrencyCardProps {
  currency: string;
  locale: string;
  hasInvoices: boolean;
}

export const CompanyCurrencyCard = ({
  currency,
  locale,
  hasInvoices,
}: CompanyCurrencyCardProps) => {
  const t = useTranslations("companySettings");

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          {t("currencyLocale.title")}
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        <Field.Root
          name="currency"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t("validation.currencyRequired");
            if (value.length !== 3)
              return t("validation.currencySize");
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("currencyLocale.currency.label")}
          </Field.Label>
          <Field.Control
            render={
              <select
                name="currency"
                defaultValue={currency}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            }
          />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        <Field.Root
          name="locale"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t("validation.localeRequired");
            if (!["en", "ar"].includes(value))
              return t("validation.localeInvalid");
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("currencyLocale.locale.label")}
          </Field.Label>
          <Field.Control
            render={
              <select
                name="locale"
                defaultValue={locale}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            }
          />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        {hasInvoices && (
          <Alert>
            <AlertIcon />
            <span className="text-sm">
              {t("currencyLocale.currencyWarning")}
            </span>
          </Alert>
        )}
      </div>
    </div>
  );
};
