"use client";

import { Package, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/actions/products";

import { type Product } from "./types";
import { ProductsHeader } from "./_components/products-header";
import { ProductsSearch } from "./_components/products-search";
import { AddProductForm } from "./_components/add-product-form";
import { ProductsTable } from "./_components/products-table";
import { Button } from "@/components/ui/button";

const ProductsPage = () => {
  const t = useTranslations("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [serverErrors, setServerErrors] = useState<
    Record<string, string[]> | undefined
  >(undefined);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    pageCount: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchProducts = useCallback(
    async (page: number, perPage: number, search?: string) => {
      setLoading(true);
      try {
        const result = await getProductsAction(page, perPage, search);
        if (result.status === 200 && result.data) {
          setProducts(result.data);
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
    fetchProducts(
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedSearch || undefined,
    );
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    fetchProducts,
  ]);

  const handleCreate = async (values: Record<string, any>) => {
    setCreating(true);
    setServerErrors(undefined);
    
    try {
      const result = await createProductAction(values);
      if (result?.status === 201 && result.data) {
        toast.success(t("toast.createSuccess"));
        setShowForm(false);
        fetchProducts(
          pagination.pageIndex + 1,
          pagination.pageSize,
          debouncedSearch || undefined,
        );
      } else if (result?.status === 422 && result.errors) {
        setServerErrors(result.errors);
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingProduct) return;
    setCreating(true);
    setServerErrors(undefined);
    try {
      const result = await updateProductAction(editingProduct.id, values);
      if (result?.status === 200 && result.data) {
        toast.success(t("toast.updateSuccess"));
        setEditingProduct(null);
        fetchProducts(
          pagination.pageIndex + 1,
          pagination.pageSize,
          debouncedSearch || undefined,
        );
      } else if (result?.status === 422 && result.errors) {
        setServerErrors(result.errors);
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (productId: number) => {
    setDeletingId(productId);
    try {
      const result = await deleteProductAction(productId);
      if (result?.status === 204) {
        toast.success(t("toast.deleteSuccess"));
        fetchProducts(
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
          <ProductsHeader onToggleForm={() => setShowForm(!showForm)} />

          <ProductsSearch value={searchInput} onChange={setSearchInput} />

          {showForm && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {t("addProductTitle")}
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
                {t("addProductDescription")}
              </p>
              <AddProductForm
                onSubmit={handleCreate}
                loading={creating}
                serverErrors={serverErrors}
              />
            </div>
          )}

          {editingProduct && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {t("editProductTitle")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditingProduct(null);
                    setServerErrors(undefined);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("editProductDescription")}
              </p>
              <AddProductForm
                onSubmit={handleUpdate}
                loading={creating}
                serverErrors={serverErrors}
                initialValues={{
                  name: editingProduct.name,
                  type: editingProduct.type,
                  unit_price: editingProduct.unit_price,
                  tax_rate: editingProduct.tax_rate,
                }}
                submitButtonLabel={t("updateProduct")}
              />
            </div>
          )}

          <ProductsTable
            products={products}
            loading={loading}
            debouncedSearch={debouncedSearch}
            deletingId={deletingId}
            pagination={pagination}
            onDelete={handleDelete}
            onEdit={(product) => {
              setEditingProduct(product);
              setShowForm(false);
              setServerErrors(undefined);
            }}
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

export default ProductsPage;
