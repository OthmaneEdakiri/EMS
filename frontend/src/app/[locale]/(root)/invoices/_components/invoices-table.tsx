"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, Trash2 } from "lucide-react";
import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { type Invoice } from "../types";
import { InvoicesEmptyState } from "./invoices-empty-state";
import { InvoicesPagination } from "./invoices-pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  debouncedSearch: string;
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
  };
  onDelete: (id: number) => void;
  onPaginationChange: (
    updater:
      | { pageIndex: number; pageSize: number }
      | ((
          old: { pageIndex: number; pageSize: number },
        ) => { pageIndex: number; pageSize: number }),
  ) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-muted text-muted-foreground line-through",
  overdue: "bg-red-100 text-red-700",
};

export const InvoicesTable = ({
  invoices,
  loading,
  debouncedSearch,
  pagination,
  onDelete,
  onPaginationChange,
}: InvoicesTableProps) => {
  const t = useTranslations("invoices");

  const columns: LegacyColumnDef<Invoice, any>[] = [
    {
      accessorKey: "number",
      header: t("columns.number"),
      cell: ({ row }) => (
        <Link
          href={`/invoices/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.number}
        </Link>
      ),
    },
    {
      accessorKey: "customer",
      header: t("columns.customer"),
      cell: ({ row }) => row.original.customer?.name || "—",
    },
    {
      accessorKey: "issue_date",
      header: t("columns.date"),
      cell: ({ row }) =>
        row.original.issue_date
          ? new Date(row.original.issue_date).toLocaleDateString()
          : "—",
    },
    {
      accessorKey: "due_date",
      header: t("columns.dueDate"),
      cell: ({ row }) =>
        row.original.due_date
          ? new Date(row.original.due_date).toLocaleDateString()
          : "—",
    },
    {
      accessorKey: "total",
      header: t("columns.total"),
      cell: ({ row }) => (row.original.total / 100).toFixed(2),
    },
    {
      accessorKey: "display_status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const status = row.original.display_status;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[status] || ""}`}
          >
            {t(`status.${status}`)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-1">
            <Link href={`/invoices/${invoice.id}`}>
              <Button variant="ghost" size="icon-sm">
                <Eye className="size-4" />
              </Button>
            </Link>
            {invoice.status === "draft" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(invoice.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.pageCount,
    onPaginationChange,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  return (
    <div className="rounded-lg border bg-card">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : invoices.length === 0 ? (
        <InvoicesEmptyState isSearchActive={!!debouncedSearch} />
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
            <InvoicesPagination
              pageIndex={pagination.pageIndex}
              pageCount={pagination.pageCount}
              onPageChange={(page) => table.setPageIndex(page)}
            />
          )}
        </>
      )}
    </div>
  );
};
