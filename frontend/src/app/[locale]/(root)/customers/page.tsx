"use client";

import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { Users, UserPlus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCustomersAction,
  createCustomerAction,
  deleteCustomerAction,
} from "@/actions/customers";

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

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  created_at: string;
}

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

  const fetchCustomers = useCallback(async (page: number, perPage: number) => {
    setLoading(true);
    try {
      const result = await getCustomersAction(page, perPage);
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
  }, []);

  useEffect(() => {
    fetchCustomers(pagination.pageIndex + 1, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, fetchCustomers]);

  const handleCreate = async (values: Record<string, any>) => {
    setCreating(true);
    try {
      const result = await createCustomerAction(values);
      if (result?.status === 201 && result.data) {
        toast.success(t("toast.createSuccess"));
        setShowForm(false);
        fetchCustomers(pagination.pageIndex + 1, pagination.pageSize);
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
        fetchCustomers(pagination.pageIndex + 1, pagination.pageSize);
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const columns: LegacyColumnDef<Customer, any>[] = [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "email",
      header: t("columns.email"),
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "tax_id",
      header: t("columns.taxId"),
      cell: ({ row }) => row.original.tax_id || "—",
    },
    {
      accessorKey: "created_at",
      header: t("columns.createdAt"),
      cell: ({ row }) => {
        if (!row.original.created_at) return "—";
        return new Date(row.original.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const c = row.original;
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
                  {t("delete.confirmDescription", { name: c.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("delete.cancelButton")}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id)}
                >
                  {deletingId === c.id ? <Loader /> : t("delete.confirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.pageCount,
    onPaginationChange: (updater) => {
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
    },
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <UserPlus className="size-4" />
              {t("addCustomer")}
            </Button>
          </div>

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

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Users className="size-10 text-muted-foreground/50" />
                <h3 className="text-sm font-medium">{t("empty.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pagination.pageCount > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {t("pagination.page")} {pagination.pageIndex + 1}{" "}
                      {t("pagination.of")} {pagination.pageCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.pageIndex === 0}
                        onClick={() =>
                          table.setPageIndex(pagination.pageIndex - 1)
                        }
                      >
                        {t("pagination.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          pagination.pageIndex >= pagination.pageCount - 1
                        }
                        onClick={() =>
                          table.setPageIndex(pagination.pageIndex + 1)
                        }
                      >
                        {t("pagination.next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const AddCustomerForm = ({
  onSubmit,
  loading,
}: {
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
}) => {
  const t = useTranslations("customers");

  return (
    <Form onFormSubmit={onSubmit} className="flex flex-col gap-4">
      <Field.Root
        name="name"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.nameRequired");
          if (value.length < 2) return t("validation.nameMinLength");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("name.label")}
          <span className="text-destructive">*</span>
        </Field.Label>
        <Input type="text" placeholder={t("name.placeholder")} required />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root
        name="email"
        validate={(value) => {
          if (typeof value === "string" && value.length > 0) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
              return t("validation.emailInvalid");
          }
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("email.label")}
        </Field.Label>
        <Input type="email" placeholder={t("email.placeholder")} />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <div className="grid grid-cols-2 gap-4">
        <Field.Root name="phone">
          <Field.Label className="text-sm font-medium">
            {t("phone.label")}
          </Field.Label>
          <Input type="tel" placeholder={t("phone.placeholder")} />
        </Field.Root>

        <Field.Root name="tax_id">
          <Field.Label className="text-sm font-medium">
            {t("taxId.label")}
          </Field.Label>
          <Input type="text" placeholder={t("taxId.placeholder")} />
        </Field.Root>
      </div>

      <Field.Root name="address">
        <Field.Label className="text-sm font-medium">
          {t("address.label")}
        </Field.Label>
        <Input type="text" placeholder={t("address.placeholder")} />
      </Field.Root>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {t("addCustomer")}
        </Button>
      </div>
    </Form>
  );
};

export default CustomersPage;
