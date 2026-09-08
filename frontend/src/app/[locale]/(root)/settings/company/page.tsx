"use client";

import { AlertTriangle, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getCompanySettingsAction,
  updateCompanySettingsAction,
  updateCompanyLogoAction,
} from "@/actions/settings";
import { Loader } from "@/components/ui/loader";

import { type CompanySettings } from "./types";
import { CompanySettingsHeader } from "./_components/company-settings-header";
import { CompanySettingsForm } from "./_components/company-settings-form";
import { CompanySettingsConfirmDialog } from "./_components/company-settings-confirm-dialog";

const CompanySettingsPage = () => {
  const t = useTranslations("companySettings");
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<Record<
    string,
    string
  > | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<
    "currency" | "prefix" | null
  >(null);

  const originalValues = useMemo(() => {
    if (!settings) return null;
    return {
      currency: settings.currency,
      invoice_prefix: settings.invoice_prefix,
    };
  }, [settings]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const result = await getCompanySettingsAction();
    if (result && result.status === 200 && result.data) {
      setSettings(result.data);
      if (result.data.logo) {
        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        setLogoPreview(`${BACKEND_URL}/storage/${result.data.logo}`);
      } else {
        setLogoPreview(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleLogoChange = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    const formData = new FormData();
    formData.append("logo", "");
    const result = await updateCompanyLogoAction(formData);
    if (result && result.status === 200) {
      toast.success(t("toast.logoRemoved"));
      setLogoPreview(null);
      setLogoFile(null);
      setSettings((prev) => (prev ? { ...prev, logo: null } : null));
    } else {
      toast.error(result?.message || t("toast.error"));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append("logo", logoFile);
    const result = await updateCompanyLogoAction(formData);
    if (result && result.status !== 200) {
      const logoErrors = result.errors?.logo;
      const msg = Array.isArray(logoErrors) ? logoErrors[0] : result.message;
      toast.error(msg || t("toast.error"));
    }
  };

  const saveSettings = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      const result = await updateCompanySettingsAction(values);
      if (result && result.status === 200) {
        toast.success(t("toast.updateSuccess"));
        await uploadLogo();
        fetchSettings();
        setLogoFile(null);
      } else if (result && result.status === 422) {
        if (result.errors) {
          Object.values(result.errors).forEach((err: any) => {
            toast.error(err[0]);
          });
        }
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (values: Record<string, string>) => {
    if (!settings || !originalValues) return;

    const currencyChanged = values.currency !== originalValues.currency;
    const prefixChanged =
      values.invoice_prefix !== originalValues.invoice_prefix;

    if (settings.has_invoices && currencyChanged) {
      setPendingValues(values);
      setShowConfirmDialog("currency");
      return;
    }

    if (prefixChanged) {
      setPendingValues(values);
      setShowConfirmDialog("prefix");
      return;
    }

    await saveSettings(values);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(null);
    if (pendingValues) {
      saveSettings(pendingValues);
      setPendingValues(null);
    }
  };

  const handleDismissDialog = () => {
    setShowConfirmDialog(null);
    setPendingValues(null);
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <CompanySettingsHeader />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader />
            </div>
          ) : settings ? (
            <CompanySettingsForm
              settings={settings}
              saving={saving}
              logoPreview={logoPreview}
              onLogoChange={handleLogoChange}
              onRemoveLogo={handleRemoveLogo}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              {t("toast.error")}
            </div>
          )}
        </div>
      </div>

      <CompanySettingsConfirmDialog
        open={showConfirmDialog === "currency"}
        onOpenChange={(open) => {
          if (!open) handleDismissDialog();
        }}
        onConfirm={handleConfirm}
        onCancel={handleDismissDialog}
        icon={<AlertTriangle className="size-5 text-destructive" />}
        title={t("currencyWarning.title")}
        description={t("currencyWarning.description")}
        cancelLabel={t("currencyWarning.cancel")}
        confirmLabel={t("currencyWarning.confirm")}
      />

      <CompanySettingsConfirmDialog
        open={showConfirmDialog === "prefix"}
        onOpenChange={(open) => {
          if (!open) handleDismissDialog();
        }}
        onConfirm={handleConfirm}
        onCancel={handleDismissDialog}
        icon={<FileText className="size-5 text-amber-500" />}
        title={t("prefixWarning.title")}
        description={t("prefixWarning.description")}
        cancelLabel={t("prefixWarning.cancel")}
        confirmLabel={t("prefixWarning.confirm")}
      />
    </main>
  );
};

export default CompanySettingsPage;
