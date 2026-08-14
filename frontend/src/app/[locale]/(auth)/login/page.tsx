"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertIcon } from "@/components/ui/alert";
import { loginAction } from "@/actions/auth";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const LoginPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
    const [state, formAction, isPending] = useActionState(loginAction, {
    success: false,
    message: "",
  });
  const t = useTranslations('auth.login');
  
  return (
    <Form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {t('description')}
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
          name="email"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t('validation.emailRequired');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
              return t('validation.emailInvalid');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">{t('email.label')}</Field.Label>
          <Input type="email" placeholder={t("email.placeholder")} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        <Field.Root
          name="password"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t('validation.passwordRequired');
            if (value.length < 8)
              return t('validation.passwordMinLength');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">{t("password.label")}</Field.Label>
          <Input type="password" placeholder={t("password.placeholder")} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader />}
        {t("submit")}
        <ArrowRight />
      </Button>

      <div className="text-center text-sm">
        {t("authPrompt.message")}
        <Link href="/signup" className="underline underline-offset-4">
          {t("authPrompt.signUpLinkText")}
        </Link>
      </div>
    </Form>
  );
};

export default LoginPage;
