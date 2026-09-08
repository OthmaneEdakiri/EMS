"use client";

import { Building2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.webp";

interface CompanyLogoCardProps {
  logoPreview: string | null;
  onLogoChange: (file: File) => void;
  onRemoveLogo: () => void;
}

export const CompanyLogoCard = ({
  logoPreview,
  onLogoChange,
  onRemoveLogo,
}: CompanyLogoCardProps) => {
  const t = useTranslations("companySettings");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error(t("toast.logoTooLarge"));
      return;
    }

    onLogoChange(file);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Upload className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("logo.title")}</h2>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-24 items-center justify-center rounded-lg border border-dashed bg-muted">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Company logo"
                className="size-full rounded-lg object-contain"
              />
            ) : (
              <Building2 className="size-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {t("logo.upload")}
            </Button>
            {logoPreview && (
              <Button
                type="button"
                variant="ghost"
                onClick={onRemoveLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="size-4" />
                {t("logo.remove")}
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={handleChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("logo.hint")}</p>
      </div>
    </div>
  );
};
