"use server";

import { createAxiosServer } from "@/lib/axios";
import { redirect } from "@/i18n/navigation";
import { cookies } from "next/headers";

export const loginAction = async (
  credentials: Record<"email" | "password", string> | undefined,
) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);

    const response = await axiosServer.post("/login", credentials);
    if (response.status === 200) {
      (await cookies()).set("access_token", response.data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      const tenantLocale = response.data.data.tenant_locale;

      return {
        status: 200,
        message: "Login successful",
        tenantLocale,
      };
    }
  } catch (err: any) {
    if (err.status === 422) {
      return {
        status: 422,
        message: err.response.data.message,
        errors: err.response.data.errors,
      };
    }
    return {
      status: 500,
      message: "An unexpected server error occurred.",
      err,
    };
  }
};

export const logoutAction = async () => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);

    const response = await axiosServer.post("/logout");

    if (response.status === 204) {
      (await cookies()).delete("access_token");

      return {
        status: 204,
      };
    }

    return {
      status: 500,
      message: "An unexpected error occurred",
    };
  } catch (error: any) {
    return {
      status: 500,
      message: error.response?.data?.message || "An unexpected error occurredz",
    };
  }
};

export const signupAction = async (values: Record<string, string>) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/register", values);
    console.log("Signup response:", response.data); // Log the entire response data for debugging
    if (response.status === 201) {
      return {
        status: 201,
        message: "Signup successful",
        tenantLocale: response.data.data.tenant_locale,
      };
    }
    return {
      status: response.status || 500,
      message: "Unexpected response from the server.",
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

export const passwordChangeAction = async (values: Record<string, string>) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/password/change", values);
    if (response.status === 200) {
      return {
        status: 200,
        message: "Password changed successfully",
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

export const getStaffUsersAction = async () => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get("/users");
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

export const createStaffUserAction = async (values: Record<string, string>) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.post("/users", values);
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

export const deleteStaffUserAction = async (userId: number) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.delete(`/users/${userId}`);
    if (response.status === 204) {
      return {
        status: 204,
      };
    }
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    return {
      status,
      message:
        data?.message ||
        error.message ||
        "An unexpected server error occurred.",
    };
  }
};

export const getProfileAction = async () => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.get("/user");
    return response.data;
  } catch {
    return null;
  }
};

export const updateProfileAction = async (values: Record<string, string>) => {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const axiosServer = await createAxiosServer(token);
    const response = await axiosServer.put("/profile", values);
    if (response.status === 200) {
      return {
        status: 200,
        message: "Profile updated successfully",
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
