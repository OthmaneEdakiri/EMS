"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createInvoiceAction, getCustomersAction, getProductsAction } from "@/actions/invoices";
import { type Customer, type Product } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";

interface LineItem {
  product_id: number | null;
  description: string;
  qty: number;
  unit_price: number;
  tax_rate: number | null;
}

const CreateInvoicePage = () => {
  const t = useTranslations("invoices");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: null, description: "", qty: 1, unit_price: 0, tax_rate: null },
  ]);

  const loadCustomers = async () => {
    if (!customersLoaded) {
      const result = await getCustomersAction();
      if (result.status === 200) {
        setCustomers(result.data);
        setCustomersLoaded(true);
      }
    }
  };

  const loadProducts = async () => {
    if (!productsLoaded) {
      const result = await getProductsAction();
      if (result.status === 200) {
        setProducts(result.data);
        setProductsLoaded(true);
      }
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      { product_id: null, description: "", qty: 1, unit_price: 0, tax_rate: null },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof LineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const selectProduct = (index: number, productId: number | null) => {
    if (productId === null) {
      updateLine(index, "product_id", null);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product) {
      const newLines = [...lines];
      newLines[index] = {
        product_id: product.id,
        description: product.name,
        qty: 1,
        unit_price: product.unit_price,
        tax_rate: product.tax_rate,
      };
      setLines(newLines);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    for (const line of lines) {
      const lineTotal = Math.round(line.qty * line.unit_price);
      subtotal += lineTotal;
      if (line.tax_rate && line.tax_rate > 0) {
        taxTotal += Math.round(lineTotal * (line.tax_rate / 100));
      }
    }
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error(t("form.customer.placeholder"));
      return;
    }
    if (lines.length === 0 || lines.every((l) => !l.description)) {
      toast.error(t("form.lines.error"));
      return;
    }

    setLoading(true);
    try {
      const result = await createInvoiceAction({
        customer_id: selectedCustomerId,
        issue_date: issueDate,
        due_date: dueDate,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          description: l.description,
          qty: l.qty,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
        })),
      });

      if (result?.status === 201 && result.data) {
        toast.success(t("toast.createSuccess"));
        router.push(`/invoices/${result.data.id}`);
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t("form.title")}</h1>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("form.customer.label")}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedCustomerId ?? ""}
                  onFocus={loadCustomers}
                  onChange={(e) =>
                    setSelectedCustomerId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">{t("form.customer.placeholder")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("form.issueDate.label")}
                  </label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("form.dueDate.label")}
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("form.lines.title")}</h2>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-4 mr-1" />
                {t("form.addLine")}
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 items-end gap-2 rounded-md border p-3"
                >
                  <div className="col-span-12 sm:col-span-3">
                    {index === 0 && (
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("form.lines.product")}
                      </label>
                    )}
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={line.product_id ?? ""}
                      onFocus={loadProducts}
                      onChange={(e) =>
                        selectProduct(
                          index,
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">{t("form.lines.customLine")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {(p.unit_price / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    {index === 0 && (
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("form.lines.description")}
                      </label>
                    )}
                    <Input
                      placeholder={t("form.lines.description")}
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1">
                    {index === 0 && (
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("form.lines.qty")}
                      </label>
                    )}
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={line.qty}
                      onChange={(e) =>
                        updateLine(index, "qty", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    {index === 0 && (
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("form.lines.unitPrice")}
                      </label>
                    )}
                    <Input
                      type="number"
                      min="0"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          index,
                          "unit_price",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    {index === 0 && (
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("form.lines.taxRate")}
                      </label>
                    )}
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={line.tax_rate ?? ""}
                      onChange={(e) =>
                        updateLine(
                          index,
                          "tax_rate",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-8 rounded-lg border bg-card p-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("form.subtotal")}</p>
              <p className="text-lg font-semibold">
                {(totals.subtotal / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("form.taxTotal")}</p>
              <p className="text-lg font-semibold">
                {(totals.taxTotal / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("form.total")}</p>
              <p className="text-xl font-bold text-primary">
                {(totals.total / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/invoices">
              <Button variant="outline">{t("form.cancel")}</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader />}
              {t("form.saveDraft")}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateInvoicePage;
