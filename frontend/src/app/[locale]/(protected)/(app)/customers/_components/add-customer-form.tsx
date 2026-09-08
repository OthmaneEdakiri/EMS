"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface AddCustomerFormProps {
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
}

export const AddCustomerForm = ({
  onSubmit,
  loading,
}: AddCustomerFormProps) => {
  const t = useTranslations("customers");

  return (
    <Form onFormSubmit={onSubmit} className="flex flex-col gap-4">
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
        <Input type="text" placeholder={t("name.placeholder")} required />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root
        name="email"
        validate={(value) => {
          if (typeof value === "string" && value.length > 0) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
              return t("validation.emailInvalid");
          }
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("email.label")}
        </Field.Label>
        <Input type="email" placeholder={t("email.placeholder")} />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <div className="grid grid-cols-2 gap-4">
        <Field.Root name="phone">
          <Field.Label className="text-sm font-medium">
            {t("phone.label")}
          </Field.Label>
          <Input type="tel" placeholder={t("phone.placeholder")} />
        </Field.Root>

        <Field.Root name="tax_id">
          <Field.Label className="text-sm font-medium">
            {t("taxId.label")}
          </Field.Label>
          <Input type="text" placeholder={t("taxId.placeholder")} />
        </Field.Root>
      </div>

      <Field.Root name="address">
        <Field.Label className="text-sm font-medium">
          {t("address.label")}
        </Field.Label>
        <Input type="text" placeholder={t("address.placeholder")} />
      </Field.Root>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {t("addCustomer")}
        </Button>
      </div>
    </Form>
  );
};
