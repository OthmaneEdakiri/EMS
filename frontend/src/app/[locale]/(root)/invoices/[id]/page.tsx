"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Send, XCircle, CreditCard, Download, Loader } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getInvoiceAction,
  sendInvoiceAction,
  cancelInvoiceAction,
  createPaymentAction,
  downloadPdfAction,
} from "@/actions/invoices";
import { type Invoice } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-muted text-muted-foreground line-through",
  overdue: "bg-red-100 text-red-700",
};

const InvoiceDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const t = useTranslations("invoices");
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const fetchInvoice = async () => {
    const result = await getInvoiceAction(Number(id));
    if (result.status === 200 && result.data) {
      setInvoice(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleSend = async () => {
    if (!invoice) return;
    setActionLoading("send");
    const result = await sendInvoiceAction(invoice.id);
    if (result.status === 200) {
      toast.success(t("toast.sendSuccess"));
      fetchInvoice();
    } else {
      toast.error(result.message || t("toast.error"));
    }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    if (!invoice) return;
    setActionLoading("cancel");
    const result = await cancelInvoiceAction(invoice.id);
    if (result.status === 200) {
      toast.success(t("toast.cancelSuccess"));
      fetchInvoice();
    } else {
      toast.error(result.message || t("toast.error"));
    }
    setActionLoading(null);
  };

  const handlePayment = async () => {
    if (!invoice || !paymentAmount) return;
    setActionLoading("payment");
    const result = await createPaymentAction(invoice.id, {
      amount: Math.round(parseFloat(paymentAmount) * 100),
      method: paymentMethod,
      paid_at: paymentDate,
    });
    if (result.status === 201) {
      toast.success(t("toast.paymentSuccess"));
      setShowPaymentForm(false);
      setPaymentAmount("");
      fetchInvoice();
    } else {
      toast.error(result.message || t("toast.error"));
    }
    setActionLoading(null);
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setActionLoading("pdf");
    const result = await downloadPdfAction(invoice.id);
    console.log("result from handleDownloadPdf", result)
    if (result.status === 200 && result.data) {
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      toast.error(result.message || t("toast.error"));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-12">
        <Loader />
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="flex-1 flex items-center justify-center py-12">
        <p>{t("detail.notFound")}</p>
      </main>
    );
  }

  const canSend = invoice.status === "draft";
  const canCancel = ["draft", "sent"].includes(invoice.status);
  const canPay = ["sent", "partially_paid"].includes(invoice.status);
  const canDelete = invoice.status === "draft";
  const canDownload = invoice.status !== "draft";

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
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{invoice.number}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[invoice.display_status] || ""}`}
                >
                  {t(`status.${invoice.display_status}`)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canSend && (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={actionLoading === "send"}
                >
                  {actionLoading === "send" ? (
                    <Loader className="size-4" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {t("detail.send")}
                </Button>
              )}
              {canDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={actionLoading === "pdf"}
                >
                  {actionLoading === "pdf" ? (
                    <Loader className="size-4" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {t("detail.downloadPdf")}
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={actionLoading === "cancel"}
                >
                  {actionLoading === "cancel" ? (
                    <Loader className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  {t("detail.cancel")}
                </Button>
              )}
              {canPay && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  <CreditCard className="size-4" />
                  {t("detail.recordPayment")}
                </Button>
              )}
            </div>
          </div>

          {showPaymentForm && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("detail.paymentForm.title")}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("detail.paymentForm.amount")}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={(invoice.remaining_amount / 100).toFixed(2)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("detail.paymentForm.remaining")}:{" "}
                    {(invoice.remaining_amount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("detail.paymentForm.method")}
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">{t("detail.paymentForm.methods.cash")}</option>
                    <option value="bank_transfer">{t("detail.paymentForm.methods.bankTransfer")}</option>
                    <option value="check">{t("detail.paymentForm.methods.check")}</option>
                    <option value="card">{t("detail.paymentForm.methods.card")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("detail.paymentForm.date")}
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
                  {t("detail.paymentForm.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handlePayment}
                  disabled={actionLoading === "payment" || !paymentAmount}
                >
                  {actionLoading === "payment" && <Loader className="size-4" />}
                  {t("detail.paymentForm.submit")}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("detail.customer")}
              </h3>
              <p className="font-medium">{invoice.customer?.name}</p>
              {invoice.customer?.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.customer.email}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("detail.info")}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("detail.issueDate")}</dt>
                  <dd>{new Date(invoice.issue_date).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("detail.dueDate")}</dt>
                  <dd>{new Date(invoice.due_date).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">{t("detail.lines")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">{t("detail.lineColumns.description")}</th>
                    <th className="pb-2 font-medium text-right">{t("detail.lineColumns.qty")}</th>
                    <th className="pb-2 font-medium text-right">{t("detail.lineColumns.unitPrice")}</th>
                    <th className="pb-2 font-medium text-right">{t("detail.lineColumns.tax")}</th>
                    <th className="pb-2 font-medium text-right">{t("detail.lineColumns.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, index) => (
                    <tr key={line.id || index} className="border-b last:border-0">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">{line.description}</td>
                      <td className="py-2 text-right">{line.qty}</td>
                      <td className="py-2 text-right">
                        {(line.unit_price / 100).toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        {line.tax_rate ? `${line.tax_rate}%` : "—"}
                      </td>
                      <td className="py-2 text-right">
                        {(line.line_total / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("form.subtotal")}</span>
                  <span>{(invoice.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("form.taxTotal")}</span>
                  <span>{(invoice.tax_total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>{t("form.total")}</span>
                  <span>{(invoice.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {invoice.payments.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("detail.payments")}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("detail.paymentColumns.date")}</th>
                    <th className="pb-2 font-medium">{t("detail.paymentColumns.method")}</th>
                    <th className="pb-2 font-medium text-right">{t("detail.paymentColumns.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 capitalize">
                        {payment.method.replace("_", " ")}
                      </td>
                      <td className="py-2 text-right">
                        {(payment.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default InvoiceDetailPage;
