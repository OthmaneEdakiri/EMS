"use server";
import axios, { AxiosInstance } from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export const createAxiosServer = async (
  token: string | undefined
): Promise<AxiosInstance> => {
  const instance = axios.create({
    baseURL: `${BACKEND_URL}/api/v1`,
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return instance;
};