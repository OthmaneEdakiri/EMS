"use server";

import { createAxiosServer } from "@/lib/axios";
import { cookies } from "next/headers";

export const getCustomersAction = async () => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get("/customers");
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

export const createCustomerAction = async (
  values: Record<string, string | undefined>,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/customers", values);
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

export const deleteCustomerAction = async (customerId: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.delete(`/customers/${customerId}`);
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
