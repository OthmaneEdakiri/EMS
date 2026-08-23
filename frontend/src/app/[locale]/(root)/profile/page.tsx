"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { User, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { RefObject, useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import { passwordChangeAction, updateProfileAction } from "@/actions/auth";
import { Alert, AlertIcon } from "@/components/ui/alert";
import { useUserContext } from "@/contexts/user-context";

const ProfilePage = () => {
  const t = useTranslations("profile");
  const { user, updateUser } = useUserContext();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordChangeActionError, setPasswordChangeActionError] = useState<
    string | null
  >(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);

  const handleProfileSubmit = async (values: Record<string, any>) => {
    setProfileLoading(true);
    try {
      const result = await updateProfileAction(values);
      if (result?.status === 200) {
        toast.success(t("toast.updateSuccess"));
        // profileFormRef.current?.reset();
        if (result.data?.user) {
          updateUser(result.data.user);
        }
      } else if (result?.status === 422) {
        if (result.errors) {
          Object.values(result.errors).forEach((err: any) => {
            toast.error(err[0]);
          });
        }
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: Record<string, any>) => {
    setPasswordLoading(true);
    setPasswordChangeActionError(null);
    try {
      const result = await passwordChangeAction(values);
      if (result?.status === 200) {
        toast.success(t("toast.passwordSuccess"));
        passwordFormRef.current?.reset();
      } else if (result?.status === 422) {
        setPasswordChangeActionError(result.message);
        if (result.errors) {
          Object.values(result.errors).forEach((err: any) => {
            toast.error(err[0]);
          });
        }
      } else {
        setPasswordChangeActionError(result?.message || t("toast.error"));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center gap-2">
              <User className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                {t("personalInfo.title")}
              </h2>
            </div>

            <ProfileForm
              key={user?.id}
              loading={profileLoading}
              handleProfileSubmit={handleProfileSubmit}
            />
          </div>
          <Separator />

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                {t("changePassword.title")}
              </h2>
            </div>

            {passwordChangeActionError && (
              <Alert variant="destructive">
                <AlertIcon />
                {passwordChangeActionError}
              </Alert>
            )}

            <ChangePasswordForm
              handlePasswordSubmit={handlePasswordSubmit}
              passwordFormRef={passwordFormRef}
              passwordLoading={passwordLoading}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

const ProfileForm = ({
  handleProfileSubmit,
  loading,
}: {
  handleProfileSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
}) => {
  const t = useTranslations("profile");
  const { user, updateUser } = useUserContext();
  return (
    <Form onFormSubmit={handleProfileSubmit} className="flex flex-col gap-4">
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
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {t("save")}
        </Button>
      </div>
    </Form>
  );
};

const ChangePasswordForm = ({
  passwordLoading,
  handlePasswordSubmit,
  passwordFormRef,
}: {
  passwordLoading: boolean;
  handlePasswordSubmit: (values: Record<string, any>) => Promise<void>;
  passwordFormRef: RefObject<HTMLFormElement | null>;
}) => {
  const t = useTranslations("profile");
  return (
    <Form
      ref={passwordFormRef}
      onFormSubmit={handlePasswordSubmit}
      className="flex flex-col gap-4"
    >
      <Field.Root
        name="current_password"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.currentPasswordRequired");
          return null;
        }}
      >
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

      <Field.Root
        name="password"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.newPasswordRequired");
          if (value.length < 8) return t("validation.newPasswordMinLength");
          return null;
        }}
      >
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

      <Field.Root
        name="password_confirmation"
        validate={(value, formValues) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.confirmPasswordRequired");
          if (value !== formValues.password)
            return t("validation.confirmPasswordMismatch");
          return null;
        }}
      >
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
        <Button type="submit" disabled={passwordLoading}>
          {passwordLoading && <Loader />}
          {t("updatePassword")}
        </Button>
      </div>
    </Form>
  );
};

export default ProfilePage;
