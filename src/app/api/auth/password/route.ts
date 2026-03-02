import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function sanitizeNext(nextValue: string | null) {
  if (!nextValue) return "/dashboard";
  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) return "/dashboard";
  return nextValue;
}

function redirectToLogin(request: NextRequest, nextPath: string, errorCode: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", errorCode);
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeNext(String(formData.get("next") ?? "/dashboard"));

  if (!email || !password) {
    return redirectToLogin(request, nextPath, "missing_fields");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToLogin(request, nextPath, "server_config");
  }

  const supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return redirectToLogin(request, nextPath, "invalid_credentials");
  }

  const redirectResponse = NextResponse.redirect(new URL(nextPath, request.url));
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}
