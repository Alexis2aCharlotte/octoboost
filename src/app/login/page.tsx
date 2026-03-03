import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Send, AlertCircle } from "lucide-react";

function mapLoginErrorFromQuery(errorCode: string | null): string | null {
  switch (errorCode) {
    case "missing_fields":
      return "Please enter your email and password.";
    case "invalid_credentials":
      return "Invalid email or password.";
    case "auth_failed":
      return "Authentication failed. Please try again.";
    case "server_config":
      return "Authentication is temporarily unavailable. Please try again later.";
    default:
      return null;
  }
}

function normalizeSingleValue(
  value: string | string[] | undefined,
  fallback: string
) {
  if (typeof value === "string" && value.length > 0) return value;
  return fallback;
}

function sanitizeNextPath(nextValue: string) {
  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) return "/dashboard";
  return nextValue;
}

function LoginFallback({
  next,
  errorMessage,
}: {
  next: string;
  errorMessage: string | null;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center border-b border-border bg-background/95 px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <Image
            src="/Logo Octoboost.png"
            alt="OctoBoost logo"
            width={120}
            height={120}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="text-lg font-bold tracking-tight">OctoBoost</span>
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex flex-1 w-full max-w-sm items-center px-6 pt-16">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Send className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-2 text-base text-muted">Sign in to your OctoBoost account</p>
          </div>

          <form action="/api/auth/password" method="post" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="mb-1.5 block text-sm text-muted">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-muted">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const next = sanitizeNextPath(
    normalizeSingleValue(resolvedSearchParams?.next, "/dashboard")
  );
  const errorCode = normalizeSingleValue(resolvedSearchParams?.error, "");
  const errorMessage = mapLoginErrorFromQuery(errorCode || null);

  return <LoginFallback next={next} errorMessage={errorMessage} />;
}
