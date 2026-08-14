// lib/axios.ts
import axios from "axios";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Axios instance dedicated to server-side requests only
 * (Server Actions / Route Handlers).
 * It manually attaches the user's cookies stored by Next.js
 * to requests sent to Laravel.
 */
export async function createServerAxios() {
  const cookieStore = await cookies();

  // Convert all cookies stored by Next.js into a "Cookie" header
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const instance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true, // Required even for server-to-server requests (to receive Set-Cookie from the response)
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
      // The XSRF-TOKEN must be extracted from the cookies and sent in this header
      "X-XSRF-TOKEN": decodeURIComponent(
        cookieStore.get("XSRF-TOKEN")?.value || ""
      ),
    },
  });

  return instance;
}

/**
 * Helper function: takes the Laravel response (containing Set-Cookie)
 * and rewrites those cookies into Next.js cookies
 * so they are forwarded to the end user's browser.
 */
export async function forwardSetCookies(setCookieHeader: string[] | undefined) {
  if (!setCookieHeader) return;

  const cookieStore = await cookies();

  for (const rawCookie of setCookieHeader) {
    const [nameValue] = rawCookie.split(";"); // Extract only the name=value part
    const [name, ...valParts] = nameValue.split("=");
    const value = valParts.join("=");

    cookieStore.set(name.trim(), decodeURIComponent(value), {
      httpOnly: name.trim() !== "XSRF-TOKEN", // XSRF-TOKEN should be readable by JS if needed, but here it is managed server-side only
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}