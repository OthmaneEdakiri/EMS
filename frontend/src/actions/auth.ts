// app/actions/loginAction.ts
"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

type LoginResult =
  | { success: true }
  | { success: false; message: string };

export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();

  try {
    // ============================================
    // الخطوة 1: طلب /sanctum/csrf-cookie أولًا
    // ============================================
    const csrfResponse = await axios.get(`${BACKEND_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    // نحفظ الكوكيز اللي رجعت (XSRF-TOKEN + laravel_session) في متصفح المستخدم
    const csrfSetCookies = csrfResponse.headers["set-cookie"];
    saveCookiesFromLaravel(csrfSetCookies, cookieStore);

    // نقرأ XSRF-TOKEN اللي حفظناه للتو لنستخدمه في طلب اللوجن
    const xsrfToken = cookieStore.get("XSRF-TOKEN")?.value;
    const sessionCookie = cookieStore.get("laravel_session")?.value;

    // ============================================
    // الخطوة 2: إرسال طلب Login مع إرفاق الكوكيز يدويًا
    // ============================================
    const loginResponse = await axios.post(
      `${BACKEND_URL}/login`,
      { email, password },
      {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(xsrfToken || ""),
          Cookie: `XSRF-TOKEN=${xsrfToken}; laravel_session=${sessionCookie}`,
        },
      }
    );

    // نحفظ الكوكيز الجديدة بعد نجاح تسجيل الدخول (Session ID محدّث)
    const loginSetCookies = loginResponse.headers["set-cookie"];
    saveCookiesFromLaravel(loginSetCookies, cookieStore);

    return { success: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "بيانات الدخول غير صحيحة";
      return { success: false, message };
    }
    return { success: false, message: "حدث خطأ غير متوقع" };
  }
}

// ------------------------------------------------
// دالة مساعدة لحفظ الكوكيز القادمة من Laravel
// في كوكيز Next.js (حتى تصل لمتصفح المستخدم)
// ------------------------------------------------
function saveCookiesFromLaravel(
  setCookieHeaders: string[] | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  if (!setCookieHeaders) return;

  for (const rawCookie of setCookieHeaders) {
    const parts = rawCookie.split(";");
    const [name, ...valParts] = parts[0].split("=");
    const value = valParts.join("=");

    cookieStore.set(name.trim(), value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}