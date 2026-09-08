"use server";

import { createAxiosServer } from "@/lib/axios";
import { cookies } from "next/headers";

export const getCompanySettingsAction = async () => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get("/settings/company");
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

export const updateCompanySettingsAction = async (
  values: Record<string, any>,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.patch("/settings/company", values);
    if (response.status === 200) {
      return {
        status: 200,
        message: "Settings updated successfully",
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

export const updateCompanyLogoAction = async (formData: FormData) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.patch("/settings/company", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.status === 200) {
      return {
        status: 200,
        message: "Logo updated successfully",
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
