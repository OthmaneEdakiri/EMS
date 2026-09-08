"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface AddProductFormProps {
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
  serverErrors?: Record<string, string[]>;
  initialValues?: {
    name?: string;
    type?: string;
    unit_price?: number;
    tax_rate?: number | null;
  };
  submitButtonLabel?: string;
}

const ServerError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
};

export const AddProductForm = ({
  onSubmit,
  loading,
  serverErrors,
  initialValues,
  submitButtonLabel,
}: AddProductFormProps) => {
  const t = useTranslations("products");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (serverErrors && formRef.current && !initialValues) {
      formRef.current.reset();
    }
  }, [serverErrors, initialValues]);

  return (
    <Form ref={formRef} onFormSubmit={onSubmit} className="flex flex-col gap-4">
      <Field.Root
        name="name"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.nameRequired");
          if (value.length < 2) return t("validation.nameMinLength");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("name.label")}
          <span className="text-destructive">*</span>
        </Field.Label>
        <Input
          type="text"
          placeholder={t("name.placeholder")}
          defaultValue={initialValues?.name ?? ""}
          required
        />
        <Field.Error className="text-sm text-destructive" />
        <ServerError message={serverErrors?.name?.[0]} />
      </Field.Root>

      <Field.Root
        name="type"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.typeRequired");
          if (value !== "product" && value !== "service")
            return t("validation.typeInvalid");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("type.label")}
          <span className="text-destructive">*</span>
        </Field.Label>
        <Field.Control
          render={
            <select
              name="type"
              required
              defaultValue={initialValues?.type ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{t("type.placeholder")}</option>
              <option value="product">{t("type.options.product")}</option>
              <option value="service">{t("type.options.service")}</option>
            </select>
          }
        />

        <Field.Error className="text-sm text-destructive" />
        <ServerError message={serverErrors?.type?.[0]} />
      </Field.Root>

      <div className="grid grid-cols-2 gap-4">
        <Field.Root
          name="unit_price"
          validate={(value) => {
            if (typeof value === "string" && value.length === 0)
              return t("validation.unitPriceRequired");
            const num = Number(value);
            if (isNaN(num) || num < 0) return t("validation.unitPriceInvalid");
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("unitPrice.label")}
            <span className="text-destructive">*</span>
          </Field.Label>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder={t("unitPrice.placeholder")}
            defaultValue={
              initialValues?.unit_price != null
                ? String(initialValues.unit_price)
                : ""
            }
            required
          />
          <Field.Error className="text-sm text-destructive" />
          <ServerError message={serverErrors?.unit_price?.[0]} />
        </Field.Root>

        <Field.Root
          name="tax_rate"
          validate={(value) => {
            if (typeof value === "string" && value.length > 0) {
              const num = Number(value);
              if (isNaN(num) || num < 0 || num > 100)
                return t("validation.taxRateInvalid");
            }
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t("taxRate.label")}
          </Field.Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder={t("taxRate.placeholder")}
            defaultValue={
              initialValues?.tax_rate != null
                ? String(initialValues.tax_rate)
                : ""
            }
          />
          <Field.Error className="text-sm text-destructive" />
          <ServerError message={serverErrors?.tax_rate?.[0]} />
        </Field.Root>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {submitButtonLabel ?? t("addProduct")}
        </Button>
      </div>
    </Form>
  );
};
