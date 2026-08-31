"use server";

import { createAxiosServer } from "@/lib/axios";
import { cookies } from "next/headers";

export const getProductsAction = async (
  page = 1,
  perPage = 15,
  search?: string,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await axiosServer.get("/products", { params });
    return {
      status: 200,
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const createProductAction = async (
  values: Record<string, string | undefined>,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/products", values);
    if (response.status === 201) {
      return {
        status: 201,
        data: response.data.data,
      };
    }
    return {
      status: response.status,
      message: "An unexpected response was received.",
    };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    if (status === 422) {
      return {
        status,
        message: data?.message || "Validation failed.",
        errors: data?.errors || {},
      };
    }
    return {
      status,
      message:
        data?.message ||
        error.message ||
        "An unexpected server error occurred.",
    };
  }
};

export const updateProductAction = async (
  productId: number,
  values: Record<string, string | undefined>,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.patch(`/products/${productId}`, values);
    if (response.status === 200) {
      return {
        status: 200,
        data: response.data.data,
      };
    }
    return {
      status: response.status,
      message: "An unexpected response was received.",
    };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    if (status === 422) {
      return {
        status,
        message: data?.message || "Validation failed.",
        errors: data?.errors || {},
      };
    }
    return {
      status,
      message:
        data?.message ||
        error.message ||
        "An unexpected server error occurred.",
    };
  }
};

export const deleteProductAction = async (productId: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.delete(`/products/${productId}`);
    if (response.status === 204) {
      return {
        status: 204,
      };
    }
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    if (status === 422) {
      return {
        status,
        message: data?.message || "Validation failed.",
        errors: data?.errors || {},
      };
    }
    return {
      status,
      message:
        data?.message ||
        error.message ||
        "An unexpected server error occurred.",
    };
  }
};
