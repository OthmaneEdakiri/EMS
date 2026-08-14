"use client";

import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertIcon } from "@/components/ui/alert";
import { signupAction } from "@/actions/auth";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const SignupPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('auth.signup');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      password_confirmation: values.confirmPassword,
      tenant_name: values.tenant_name,
      currency: values.currency,
      invoice_prefix: values.invoice_prefix,
      tenant_locale: values.tenant_locale,
    };

    const res = await signupAction(payload);
    if (res.success) {
      toast.success(t('toast.success'));
      router.push("/invoices");
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <Form onFormSubmit={handleSubmit} className="flex flex-col gap-6">
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
          name="name"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t('validation.nameRequired');
            if (value.length < 2) return t('validation.nameMinLength');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">{t('name.label')}</Field.Label>
          <Input type="text" placeholder={t('name.placeholder')} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

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
          <Input type="email" placeholder={t('email.placeholder')} required />
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
          <Field.Label className="text-sm font-medium">{t('password.label')}</Field.Label>
          <Input type="password" placeholder={t('password.placeholder')} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        <Field.Root
          name="confirmPassword"
          validate={(value, formValues) => {
            if (typeof value !== "string" || value.length === 0)
              return t('validation.confirmPasswordRequired');
            if (value !== formValues.password) return t('validation.confirmPasswordMismatch');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t('confirmPassword.label')}
          </Field.Label>
          <Input type="password" placeholder={t('confirmPassword.placeholder')} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('companyDetails')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Field.Root
          name="tenant_name"
          validate={(value) => {
            if (typeof value !== "string" || value.length === 0)
              return t('validation.companyNameRequired');
            if (value.length < 3)
              return t('validation.companyNameMinLength');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">
            {t('companyName.label')}
          </Field.Label>
          <Input type="text" placeholder={t('companyName.placeholder')} required />
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>

        <div className="grid grid-cols-2 gap-4">
          <Field.Root
            name="currency"
            validate={(value) => {
              if (typeof value !== "string" || value.length === 0)
                return t('validation.currencyRequired');
              if (value.length > 8)
                return t('validation.currencyMaxLength');
              return null;
            }}
          >
            <Field.Label className="text-sm font-medium">{t('currency.label')}</Field.Label>
            <Input
              type="text"
              placeholder={t('currency.placeholder')}
              className="uppercase"
              required
            />
            <Field.Error className="text-sm text-destructive" />
          </Field.Root>

          <Field.Root
            name="invoice_prefix"
            validate={(value) => {
              if (typeof value !== "string" || value.length === 0)
                return t('validation.prefixRequired');
              if (value.length > 20)
                return t('validation.prefixMaxLength');
              return null;
            }}
          >
            <Field.Label className="text-sm font-medium">
              {t('invoicePrefix.label')}
            </Field.Label>
            <Input
              type="text"
              placeholder={t('invoicePrefix.placeholder')}
              className="uppercase"
              required
            />
            <Field.Error className="text-sm text-destructive" />
          </Field.Root>
        </div>

        <Field.Root
          name="tenant_locale"
          validate={(value) => {
            if (value !== "ar" && value !== "en")
              return t('validation.languageRequired');
            return null;
          }}
        >
          <Field.Label className="text-sm font-medium">{t('language.label')}</Field.Label>
          <Field.Control render={

            <select
            name="tenant_locale"
            defaultValue=""
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t('language.placeholder')}
            </option>
            <option value="en">{t('language.options.en')}</option>
            <option value="ar">{t('language.options.ar')}</option>
          </select>
          } />
          
          <Field.Error className="text-sm text-destructive" />
        </Field.Root>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader />}
        {t('submit')}
        <ArrowRight />
      </Button>

      <div className="text-center text-sm">
        {t('authPrompt.message')}{" "}
        <Link href="/login" className="underline underline-offset-4">
          {t('authPrompt.loginLinkText')}
        </Link>
      </div>
    </Form>
  );
};

export default SignupPage;
