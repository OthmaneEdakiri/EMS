"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useUserContext } from "@/contexts/user-context";

interface AddProductFormProps {
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
  serverErrors?: Record<string, string[]>;
  initialValues?: {
    name?: string;
    type?: string;
    unit_price?: number;
    tax_rate?: number | null;
    track_stock?: boolean;
    quantity_on_hand?: number;
    reorder_level?: number | null;
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
  const { user } = useUserContext();
  const isOwner = user?.role === "owner";

  const [selectedType, setSelectedType] = useState<string>(
    initialValues?.type ?? "",
  );
  const [trackStock, setTrackStock] = useState<boolean>(
    initialValues?.track_stock ?? false,
  );

  const showStockFields =
    isOwner && selectedType === "product";

  useEffect(() => {
    if (serverErrors && formRef.current && !initialValues) {
      formRef.current.reset();
      setSelectedType("");
      setTrackStock(false);
    }
  }, [serverErrors, initialValues]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    if (value !== "product") {
      setTrackStock(false);
    }
  };

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
              onChange={(e) => handleTypeChange(e.target.value)}
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

      {showStockFields && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="track_stock"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <label className="text-sm font-medium">
                {t("stock.trackStock")}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stock.trackStockDescription")}
            </p>

            {trackStock && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Field.Root
                  name="opening_quantity"
                  validate={(value) => {
                    if (!trackStock) return null;
                    if (typeof value === "string" && value.length === 0)
                      return t("validation.openingQuantityRequired");
                    const num = Number(value);
                    if (isNaN(num) || num < 0 || !Number.isInteger(num))
                      return t("validation.openingQuantityInvalid");
                    return null;
                  }}
                >
                  <Field.Label className="text-sm font-medium">
                    {t("stock.openingQuantity")}
                  </Field.Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t("stock.openingQuantityPlaceholder")}
                    defaultValue={
                      initialValues?.quantity_on_hand != null
                        ? String(initialValues.quantity_on_hand)
                        : "0"
                    }
                  />
                  <Field.Error className="text-sm text-destructive" />
                  <ServerError message={serverErrors?.opening_quantity?.[0]} />
                </Field.Root>

                <Field.Root
                  name="reorder_level"
                  validate={(value) => {
                    if (typeof value === "string" && value.length > 0) {
                      const num = Number(value);
                      if (isNaN(num) || num < 0 || !Number.isInteger(num))
                        return t("validation.reorderLevelInvalid");
                    }
                    return null;
                  }}
                >
                  <Field.Label className="text-sm font-medium">
                    {t("stock.reorderLevel")}
                  </Field.Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t("stock.reorderLevelPlaceholder")}
                    defaultValue={
                      initialValues?.reorder_level != null
                        ? String(initialValues.reorder_level)
                        : ""
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("stock.reorderLevelHelp")}
                  </p>
                  <Field.Error className="text-sm text-destructive" />
                  <ServerError message={serverErrors?.reorder_level?.[0]} />
                </Field.Root>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {submitButtonLabel ?? t("addProduct")}
        </Button>
      </div>
    </Form>
  );
};
