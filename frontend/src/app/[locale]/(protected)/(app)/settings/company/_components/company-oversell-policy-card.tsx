"use client";

import { Field } from "@base-ui/react/field";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanyOversellPolicyCardProps {
  oversellPolicy: string;
  disabled?: boolean;
}

export const CompanyOversellPolicyCard = ({
  oversellPolicy,
  disabled,
}: CompanyOversellPolicyCardProps) => {
  const t = useTranslations("companySettings");

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("oversellPolicy.title")}</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("oversellPolicy.description")}
      </p>
      <Field.Root name="oversell_policy">
        <Field.Control
          render={
            <div className="flex flex-col gap-3">
              <label
                className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                  oversellPolicy === "block"
                    ? "border-primary bg-primary/5"
                    : "border-input"
                } ${disabled ? "opacity-60" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="oversell_policy"
                  value="block"
                  defaultChecked={oversellPolicy === "block"}
                  disabled={disabled}
                  className="size-4"
                />
                <div>
                  <div className="text-sm font-medium">
                    {t("oversellPolicy.block")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("oversellPolicy.blockDescription")}
                  </div>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                  oversellPolicy === "warn"
                    ? "border-primary bg-primary/5"
                    : "border-input"
                } ${disabled ? "opacity-60" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="oversell_policy"
                  value="warn"
                  defaultChecked={oversellPolicy === "warn"}
                  disabled={disabled}
                  className="size-4"
                />
                <div>
                  <div className="text-sm font-medium">
                    {t("oversellPolicy.warn")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("oversellPolicy.warnDescription")}
                  </div>
                </div>
              </label>
            </div>
          }
        />
      </Field.Root>
    </div>
  );
};
