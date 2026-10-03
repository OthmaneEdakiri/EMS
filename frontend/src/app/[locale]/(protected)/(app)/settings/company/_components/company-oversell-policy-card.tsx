"use client";

import { Field } from "@base-ui/react/field";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanyOversellPolicyCardProps {
  oversellPolicy: string;
  disabled?: boolean;
}

const OPTIONS = ["block", "warn"] as const;

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

      <Field.Root name="oversell_policy" disabled={disabled}>
        <RadioGroup
          defaultValue={oversellPolicy}
          disabled={disabled}
          className="flex flex-col gap-3"
        >
          {OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-md border border-input p-3 transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 ${
                disabled ? "opacity-60" : "cursor-pointer"
              }`}
            >
              <Radio.Root
                value={option}
                className="flex size-4 items-center justify-center rounded-full border border-input data-[checked]:border-primary"
              >
                <Radio.Indicator className="size-2 rounded-full bg-primary" />
              </Radio.Root>
              <div>
                <div className="text-sm font-medium">
                  {t(`oversellPolicy.${option}`)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t(`oversellPolicy.${option}Description`)}
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </Field.Root>
    </div>
  );
};