"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getInvoicesAction,
  deleteInvoiceAction,
} from "@/actions/invoices";
import { type Invoice } from "./types";
import { InvoicesHeader } from "./_components/invoices-header";
import { InvoicesSearch } from "./_components/invoices-search";
import { InvoiceStatusFilter } from "./_components/invoice-status-filter";
import { InvoicesTable } from "./_components/invoices-table";

const InvoicesPage = () => {
  const t = useTranslations("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    pageCount: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchInvoices = useCallback(
    async (
      page: number,
      perPage: number,
      status?: string,
      search?: string,
    ) => {
      setLoading(true);
      try {
        const result = await getInvoicesAction(page, perPage, status, search);
        if (result.status === 200 && result.data) {
          setInvoices(result.data);
          if (result.meta) {
            setPagination((prev) => ({
              ...prev,
              pageCount: result.meta.last_page,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchInvoices(
      pagination.pageIndex + 1,
      pagination.pageSize,
      statusFilter === "all" ? undefined : statusFilter,
      debouncedSearch || undefined,
    );
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    statusFilter,
    debouncedSearch,
    fetchInvoices,
  ]);

  const handleDelete = async (id: number) => {
    const result = await deleteInvoiceAction(id);
    if (result?.status === 200) {
      toast.success(t("toast.deleteSuccess"));
      fetchInvoices(
        pagination.pageIndex + 1,
        pagination.pageSize,
        statusFilter === "all" ? undefined : statusFilter,
        debouncedSearch || undefined,
      );
    } else {
      toast.error(result?.message || t("toast.error"));
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <InvoicesHeader />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <InvoicesSearch
              value={searchInput}
              onChange={setSearchInput}
            />
            <InvoiceStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <InvoicesTable
            invoices={invoices}
            loading={loading}
            debouncedSearch={debouncedSearch}
            pagination={pagination}
            onDelete={handleDelete}
            onPaginationChange={(updater) => {
              setPagination((prev) => {
                const next =
                  typeof updater === "function"
                    ? updater({
                        pageIndex: prev.pageIndex,
                        pageSize: prev.pageSize,
                      })
                    : updater;
                return { ...prev, ...next };
              });
            }}
          />
        </div>
      </div>
    </main>
  );
};

export default InvoicesPage;
