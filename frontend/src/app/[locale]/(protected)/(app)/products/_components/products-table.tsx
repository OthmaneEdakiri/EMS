"use client";

import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { type Product } from "../types";
import { ProductDeleteDialog } from "./product-delete-dialog";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { ProductsEmptyState } from "./products-empty-state";
import { ProductsPagination } from "./products-pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/contexts/user-context";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  debouncedSearch: string;
  deletingId: number | null;
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
  };
  onDelete: (productId: number) => void;
  onEdit: (product: Product) => void;
  onPaginationChange: (
    updater: { pageIndex: number; pageSize: number } | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number }),
  ) => void;
  onRefresh: () => void;
}

export const ProductsTable = ({
  products,
  loading,
  debouncedSearch,
  deletingId,
  pagination,
  onDelete,
  onEdit,
  onPaginationChange,
  onRefresh,
}: ProductsTableProps) => {
  const t = useTranslations("products");
  const { user } = useUserContext();
  const isOwner = user?.role === "owner";

  const columns: LegacyColumnDef<Product, any>[] = [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "type",
      header: t("columns.type"),
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
            {t(`type.options.${type}`)}
          </span>
        );
      },
    },
    {
      accessorKey: "unit_price",
      header: t("columns.unitPrice"),
      cell: ({ row }) => {
        return (row.original.unit_price / 100).toFixed(2);
      },
    },
    {
      accessorKey: "tax_rate",
      header: t("columns.taxRate"),
      cell: ({ row }) => {
        return row.original.tax_rate != null
          ? `${row.original.tax_rate}%`
          : "\u2014";
      },
    },
    ...(isOwner
      ? [
          {
            accessorKey: "quantity_on_hand" as const,
            header: t("stock.quantityOnHand"),
            cell: ({ row }: { row: { original: Product } }) => {
              const p = row.original;
              if (!p.track_stock) {
                return (
                  <span className="text-muted-foreground text-xs">
                    {t("stock.notTracked")}
                  </span>
                );
              }
              const isLow =
                p.reorder_level != null &&
                p.quantity_on_hand <= p.reorder_level;
              return (
                <div className="flex items-center gap-2">
                  <span className={isLow ? "font-semibold text-amber-600" : ""}>
                    {p.quantity_on_hand}
                  </span>
                  {isLow && (
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      {t("stock.lowStock")}
                    </span>
                  )}
                </div>
              );
            },
          } as LegacyColumnDef<Product, any>,
        ]
      : []),
    {
      accessorKey: "created_at",
      header: t("columns.createdAt"),
      cell: ({ row }) => {
        if (!row.original.created_at) return "\u2014";
        return new Date(row.original.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(p)}
            >
              <Pencil className="size-3" />
            </Button>
            {isOwner && p.track_stock && (
              <StockAdjustmentDialog product={p} onAdjusted={onRefresh} />
            )}
            <ProductDeleteDialog
              productName={p.name}
              disabled={deletingId === p.id}
              onDelete={() => onDelete(p.id)}
            />
          </div>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data: products,
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
      ) : products.length === 0 ? (
        <ProductsEmptyState isSearchActive={!!debouncedSearch} />
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
            <ProductsPagination
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
