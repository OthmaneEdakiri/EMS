"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Settings2 } from "lucide-react";
import { adjustStockAction } from "@/actions/products";
import { type Product } from "../types";

interface StockAdjustmentDialogProps {
  product: Product;
  onAdjusted: () => void;
}

export const StockAdjustmentDialog = ({
  product,
  onAdjusted,
}: StockAdjustmentDialogProps) => {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"new_quantity" | "delta">("new_quantity");
  const [newQuantity, setNewQuantity] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const currentStock = product.quantity_on_hand;

  const handleSubmit = async () => {
    setErrors({});
    setLoading(true);
    try {
      const values: { new_quantity?: number; delta?: number; reason: string } = {
        reason,
      };
      if (mode === "new_quantity") {
        values.new_quantity = Number(newQuantity);
      } else {
        values.delta = Number(delta);
      }
      const result = await adjustStockAction(product.id, values);
      if (result?.status === 201) {
        toast.success(t("toast.stockAdjusted"));
        setOpen(false);
        setNewQuantity("");
        setDelta("");
        setReason("");
        setMode("new_quantity");
        onAdjusted();
      } else if (result?.status === 422 && result.errors) {
        setErrors(result.errors);
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
    setNewQuantity("");
    setDelta("");
    setReason("");
    setMode("new_quantity");
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-xs" title={t("stock.adjustStock")} />
        }
      >
        <Settings2 className="size-3" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("stock.adjustment.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("stock.adjustment.description", { name: product.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {t("stock.adjustment.currentStock")}:
            </span>{" "}
            <span className="font-semibold">{currentStock}</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {t("stock.adjustment.mode")}
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "new_quantity" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("new_quantity")}
              >
                {t("stock.adjustment.modes.newQuantity")}
              </Button>
              <Button
                type="button"
                variant={mode === "delta" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("delta")}
              >
                {t("stock.adjustment.modes.delta")}
              </Button>
            </div>
          </div>

          {mode === "new_quantity" ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("stock.adjustment.newQuantityLabel")}
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder={t("stock.adjustment.newQuantityPlaceholder")}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
              {errors.new_quantity?.[0] && (
                <p className="text-sm text-destructive">
                  {errors.new_quantity[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t("stock.adjustment.deltaLabel")}
              </label>
              <Input
                type="number"
                step="1"
                placeholder={t("stock.adjustment.deltaPlaceholder")}
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
              {errors.delta?.[0] && (
                <p className="text-sm text-destructive">{errors.delta[0]}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {t("stock.adjustment.reasonLabel")}
            </label>
            <Input
              type="text"
              placeholder={t("stock.adjustment.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {errors.reason?.[0] && (
              <p className="text-sm text-destructive">{errors.reason[0]}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {t("stock.adjustment.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={
              loading ||
              (mode === "new_quantity" && newQuantity === "") ||
              (mode === "delta" && delta === "") ||
              reason.trim() === ""
            }
          >
            {loading ? (
              <>
                <Loader />
                {t("stock.adjustment.submitting")}
              </>
            ) : (
              t("stock.adjustment.submit")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
