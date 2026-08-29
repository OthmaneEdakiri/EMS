"use client";

import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { type Customer } from "../types";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { CustomersEmptyState } from "./customers-empty-state";
import { CustomersPagination } from "./customers-pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader } from "@/components/ui/loader";

interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  debouncedSearch: string;
  deletingId: number | null;
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
  };
  onDelete: (customerId: number) => void;
  onPaginationChange: (
    updater: { pageIndex: number; pageSize: number } | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number }),
  ) => void;
}

export const CustomersTable = ({
  customers,
  loading,
  debouncedSearch,
  deletingId,
  pagination,
  onDelete,
  onPaginationChange,
}: CustomersTableProps) => {
  const t = useTranslations("customers");

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
          <CustomerDeleteDialog
            customerName={c.name}
            disabled={deletingId === c.id}
            onDelete={() => onDelete(c.id)}
          />
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
      ) : customers.length === 0 ? (
        <CustomersEmptyState isSearchActive={!!debouncedSearch} />
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
            <CustomersPagination
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
