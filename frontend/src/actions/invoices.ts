"use server";

import { createAxiosServer } from "@/lib/axios";
import { cookies } from "next/headers";

export const getInvoicesAction = async (
  page = 1,
  perPage = 15,
  status?: string,
  search?: string,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (status && status !== "all") {
      params.status = status;
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await axiosServer.get("/invoices", { params });
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

export const getInvoiceAction = async (id: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get(`/invoices/${id}`);
    return {
      status: 200,
      data: response.data.data,
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

export const createInvoiceAction = async (values: Record<string, any>) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/invoices", values);
    if (response.status === 201) {
      return {
        status: 201,
        data: response.data.data,
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

export const deleteInvoiceAction = async (id: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.delete(`/invoices/${id}`);
    return { status: response.status };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const sendInvoiceAction = async (id: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post(`/invoices/${id}/send`);
    return { status: 200, data: response.data.data };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const cancelInvoiceAction = async (id: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post(`/invoices/${id}/cancel`);
    return { status: 200, data: response.data.data };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const createPaymentAction = async (
  invoiceId: number,
  values: Record<string, any>,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post(
      `/invoices/${invoiceId}/payments`,
      values,
    );
    return { status: 201, data: response.data.data };
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
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const downloadPdfAction = async (id: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get(`/invoices/${id}/pdf`, {
      responseType: "arraybuffer",
    });
    
    const base64 = Buffer.from(response.data).toString("base64");
    return { status: 200, data: base64 };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message: data?.message || "An unexpected error occurred.",
    };
  }
};

export const getCustomersAction = async (search?: string) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const params: Record<string, string | number> = { per_page: 100 };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await axiosServer.get("/customers", { params });
    return { status: 200, data: response.data.data };
  } catch (error: any) {
    return { status: 500, data: [] };
  }
};

export const getProductsAction = async (search?: string) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const params: Record<string, string | number> = { per_page: 100 };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await axiosServer.get("/products", { params });
    return { status: 200, data: response.data.data };
  } catch (error: any) {
    return { status: 500, data: [] };
  }
};
