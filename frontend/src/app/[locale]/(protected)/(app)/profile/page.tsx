"use client";

import { User, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { Alert, AlertIcon } from "@/components/ui/alert";
import { useUserContext } from "@/contexts/user-context";
import { updateProfileAction, passwordChangeAction } from "@/actions/auth";
import { useFormAction } from "./_components/use-form-action";
import { ProfileForm } from "./_components/profile-form";
import { ChangePasswordForm } from "./_components/change-password-form";
import type { ActionResult } from "./types";

const ProfilePage = () => {
  const t = useTranslations("profile");
  const { user, updateUser } = useUserContext();
  const passwordFormRef = useRef<HTMLFormElement>(null);

  const handleProfileSuccess = useCallback(
    (result: ActionResult) => {
      toast.success(t("toast.updateSuccess"));
      const user = result.data?.user as
        | { id: number; name: string; email: string; role: "owner" | "staff" }
        | undefined;
      if (user) {
        updateUser(user);
      }
    },
    [t, updateUser],
  );

  const handlePasswordSuccess = useCallback(() => {
    toast.success(t("toast.passwordSuccess"));
    passwordFormRef.current?.reset();
  }, [t]);

  const {
    submit: handleProfileSubmit,
    loading: profileLoading,
  } = useFormAction(updateProfileAction, {
    onSuccess: handleProfileSuccess,
  });

  const {
    submit: handlePasswordSubmit,
    loading: passwordLoading,
    error: passwordError,
  } = useFormAction(passwordChangeAction, {
    onSuccess: handlePasswordSuccess,
  });

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
              onSubmit={handleProfileSubmit}
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

            {passwordError && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <AlertIcon />
                {passwordError}
              </Alert>
            )}

            <ChangePasswordForm
              formRef={passwordFormRef}
              loading={passwordLoading}
              onSubmit={handlePasswordSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
