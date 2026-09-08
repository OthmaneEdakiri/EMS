"use client";

import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCustomersAction,
  createCustomerAction,
  deleteCustomerAction,
} from "@/actions/customers";

import { type Customer } from "./types";
import { CustomersHeader } from "./_components/customers-header";
import { CustomersSearch } from "./_components/customers-search";
import { AddCustomerForm } from "./_components/add-customer-form";
import { CustomersTable } from "./_components/customers-table";
import { Button } from "@/components/ui/button";

const CustomersPage = () => {
  const t = useTranslations("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    pageCount: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchCustomers = useCallback(
    async (page: number, perPage: number, search?: string) => {
      setLoading(true);
      try {
        const result = await getCustomersAction(page, perPage, search);
        if (result.status === 200 && result.data) {
          setCustomers(result.data);
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
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers(
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedSearch || undefined,
    );
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    fetchCustomers,
  ]);

  const handleCreate = async (values: Record<string, any>) => {
    setCreating(true);
    try {
      const result = await createCustomerAction(values);
      if (result?.status === 201 && result.data) {
        toast.success(t("toast.createSuccess"));
        setShowForm(false);
        fetchCustomers(
          pagination.pageIndex + 1,
          pagination.pageSize,
          debouncedSearch || undefined,
        );
      } else {
        toast.error(t("toast.error"));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (customerId: number) => {
    setDeletingId(customerId);
    try {
      const result = await deleteCustomerAction(customerId);
      if (result?.status === 204) {
        toast.success(t("toast.deleteSuccess"));
        fetchCustomers(
          pagination.pageIndex + 1,
          pagination.pageSize,
          debouncedSearch || undefined,
        );
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <CustomersHeader onToggleForm={() => setShowForm(!showForm)} />

          <CustomersSearch value={searchInput} onChange={setSearchInput} />

          {showForm && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {t("addCustomerTitle")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowForm(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("addCustomerDescription")}
              </p>
              <AddCustomerForm onSubmit={handleCreate} loading={creating} />
            </div>
          )}

          <CustomersTable
            customers={customers}
            loading={loading}
            debouncedSearch={debouncedSearch}
            deletingId={deletingId}
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

export default CustomersPage;
