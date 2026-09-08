"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertIcon } from "@/components/ui/alert";
import {
  passwordChangeAction,
  getMeAction,
  logoutAction,
} from "@/actions/auth";
import { useUserContext } from "@/contexts/user-context";
import {
  createRequiredValidator,
  createMinLengthValidator,
  createMatchValidator,
} from "@/app/[locale]/(protected)/(app)/profile/types";

const ForceChangePasswordPage = () => {
  const router = useRouter();
  const { updateUser } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("auth.forceChangePassword");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await getMeAction();
        if (!me?.user) {
          router.replace("/login");
          return;
        }
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

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

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await passwordChangeAction(values);
      if (result?.status === 200) {
        toast.success(t("toast.success"));
        updateUser({ mustChangePassword: false });
        router.push("/invoices");
      } else if (result?.status === 422) {
        setError(result.message);
        if (result.errors) {
          Object.values(result.errors).forEach((err: any) => {
            toast.error(err[0]);
          });
        }
      } else {
        setError(result?.message || "An error occurred");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <div className="flex justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Form onFormSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-balance text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <Field.Root
              name="current_password"
              validate={validateCurrentPassword}
            >
              <Field.Label className="text-sm font-medium">
                {t("currentPassword.label")}
              </Field.Label>
              <Input
                type="password"
                placeholder={t("currentPassword.placeholder")}
                required
              />
              <Field.Error className="text-sm text-destructive" />
            </Field.Root>

            <Field.Root name="password" validate={validateNewPassword}>
              <Field.Label className="text-sm font-medium">
                {t("newPassword.label")}
              </Field.Label>
              <Input
                type="password"
                placeholder={t("newPassword.placeholder")}
                required
              />
              <Field.Error className="text-sm text-destructive" />
            </Field.Root>

            <Field.Root
              name="password_confirmation"
              validate={validateConfirmPassword}
            >
              <Field.Label className="text-sm font-medium">
                {t("confirmPassword.label")}
              </Field.Label>
              <Input
                type="password"
                placeholder={t("confirmPassword.placeholder")}
                required
              />
              <Field.Error className="text-sm text-destructive" />
            </Field.Root>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader />}
            {t("submit")}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </Form>
      </div>
    </main>
  );
};

export default ForceChangePasswordPage;
