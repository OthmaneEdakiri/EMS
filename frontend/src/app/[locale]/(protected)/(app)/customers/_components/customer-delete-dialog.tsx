"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface CustomerDeleteDialogProps {
  customerName: string;
  disabled: boolean;
  onDelete: () => void;
}

export const CustomerDeleteDialog = ({
  customerName,
  disabled,
  onDelete,
}: CustomerDeleteDialogProps) => {
  const t = useTranslations("customers");

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-xs" />}
      >
        <Trash2 className="size-3 text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.confirmDescription", { name: customerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("delete.cancelButton")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={disabled}
            onClick={onDelete}
          >
            {disabled ? <Loader /> : t("delete.confirmButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
