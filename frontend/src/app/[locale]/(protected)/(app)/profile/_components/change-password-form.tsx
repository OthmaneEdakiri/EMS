"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useTranslations } from "next-intl";
import { RefObject } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  createRequiredValidator,
  createMinLengthValidator,
  createMatchValidator,
} from "../types";

interface ChangePasswordFormProps {
  onSubmit: (values: Record<string, string>) => void;
  loading: boolean;
  formRef: RefObject<HTMLFormElement | null>;
}

export const ChangePasswordForm = ({
  onSubmit,
  loading,
  formRef,
}: ChangePasswordFormProps) => {
  const t = useTranslations("profile");

  const validateCurrentPassword = createRequiredValidator(
    t("validation.currentPasswordRequired"),
  );
  const validateNewPassword = createMinLengthValidator(
    t("validation.newPasswordRequired"),
    t("validation.newPasswordMinLength"),
  );
  const validateConfirmPassword = createMatchValidator(
    t("validation.confirmPasswordRequired"),
    t("validation.confirmPasswordMismatch"),
    "password",
  );

  return (
    <Form
      ref={formRef}
      onFormSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      <Field.Root name="current_password" validate={validateCurrentPassword}>
        <Field.Label className="text-sm font-medium">
          {t("changePassword.currentPassword.label")}
        </Field.Label>
        <Input
          type="password"
          placeholder={t("changePassword.currentPassword.placeholder")}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root name="password" validate={validateNewPassword}>
        <Field.Label className="text-sm font-medium">
          {t("changePassword.newPassword.label")}
        </Field.Label>
        <Input
          type="password"
          placeholder={t("changePassword.newPassword.placeholder")}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root name="password_confirmation" validate={validateConfirmPassword}>
        <Field.Label className="text-sm font-medium">
          {t("changePassword.confirmPassword.label")}
        </Field.Label>
        <Input
          type="password"
          placeholder={t("changePassword.confirmPassword.placeholder")}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading && <Loader />}
          {t("updatePassword")}
        </Button>
      </div>
    </Form>
  );
};
