"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useUserContext } from "@/contexts/user-context";
import { createNameValidator } from "../types";

interface ProfileFormProps {
  onSubmit: (values: Record<string, string>) => void;
  loading: boolean;
}

export const ProfileForm = ({ onSubmit, loading }: ProfileFormProps) => {
  const t = useTranslations("profile");
  const { user } = useUserContext();

  const validateName = createNameValidator(
    t("validation.nameRequired"),
    t("validation.nameMinLength"),
  );

  return (
    <Form onFormSubmit={onSubmit} className="flex flex-col gap-4">
      <Field.Root name="name" validate={validateName}>
        <Field.Label className="text-sm font-medium">
          {t("personalInfo.name.label")}
        </Field.Label>
        <Input
          type="text"
          placeholder={t("personalInfo.name.placeholder")}
          defaultValue={user?.name ?? ""}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root name="email">
        <Field.Label className="text-sm font-medium">
          {t("personalInfo.email.label")}
        </Field.Label>
        <Input
          type="email"
          placeholder={t("personalInfo.email.placeholder")}
          defaultValue={user?.email ?? ""}
          disabled
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root name="role">
        <Field.Label className="text-sm font-medium">
          {t("personalInfo.role.label")}
        </Field.Label>
        <Input defaultValue={user?.role ?? ""} disabled />
      </Field.Root>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading && <Loader />}
          {t("save")}
        </Button>
      </div>
    </Form>
  );
};
