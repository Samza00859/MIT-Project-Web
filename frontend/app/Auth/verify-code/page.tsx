"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSidebar from "@/components/AuthSidebar";
import PasscodeInput from "@/components/PasscodeInput";
import { buildApiUrl, mapFetchError } from "@/lib/api";

function VerifyCodeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = (params.get("email") || "").trim();

  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [info, setInfo] = React.useState<string>("");
  const [devCode, setDevCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Optional dev helper passed from register flow
    const dc = params.get("devCode");
    if (dc) setDevCode(dc);
  }, [params]);

  const verify = async (activationCode: string) => {
    if (!email) {
      setError("Missing email. Please go back and try again.");
      return;
    }
    setError("");
    setInfo("");
    setIsVerifying(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const requestUrl = buildApiUrl("/api/auth/verify-code");
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, code: activationCode }),
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      } as RequestInit);

      if (!res.ok) {
        const text = await res.text();
        let msg = `Verification failed (${res.status})`;
        try {
          const json = text ? JSON.parse(text) : null;
          msg = json?.detail || json?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/Auth/login?verified=true");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : mapFetchError(err, "/api/auth/verify-code"));
      }
      setCode("");
    } finally {
      clearTimeout(timeoutId);
      setIsVerifying(false);
    }
  };

  const resend = async () => {
    if (!email) {
      setError("Missing email. Please go back and try again.");
      return;
    }
    setError("");
    setInfo("");
    setIsResending(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const requestUrl = buildApiUrl("/api/auth/resend-verification-code");
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      } as RequestInit);

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const msg = json?.detail || json?.message || `Failed to resend (${res.status})`;
        throw new Error(msg);
      }

      if (json?.dev_verification_code) setDevCode(String(json.dev_verification_code));
      setInfo("A new code has been sent. Please check your email.");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : mapFetchError(err, "/api/auth/resend-verification-code"));
      }
    } finally {
      clearTimeout(timeoutId);
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E5E5E5]">
      <AuthSidebar />
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative">
        <div className="w-full max-w-2xl relative">
          <Link
            href="/Auth/login"
            className="absolute -top-8 left-0 text-base font-semibold text-gray-600 cursor-pointer hover:text-black"
          >
            ← Back
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Verify your email</h2>

          <div className="bg-white rounded-[2.5rem] px-12 py-14 shadow-lg w-full">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            {info && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{info}</p>
              </div>
            )}

            <div className="mb-8 text-center">
              <p className="text-sm text-gray-700">We have sent a 6-number code to</p>
              <p className="text-sm font-semibold text-gray-900 break-all">{email || "your email"}</p>
              <p className="text-xs text-gray-500 mt-2">The code expires soon, so please hurry.</p>
              {devCode && (
                <p className="text-xs text-gray-500 mt-2">
                  Dev code: <span className="font-mono font-semibold text-gray-800">{devCode}</span>
                </p>
              )}
            </div>

            <PasscodeInput
              value={code}
              onChange={(v) => setCode(v)}
              onComplete={(v) => verify(v)}
              disabled={isVerifying || isResending}
              autoFocus
            />

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => verify(code)}
                disabled={isVerifying || isResending || code.length !== 6}
                className="bg-black text-white rounded-full px-10 py-3 text-sm font-semibold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={resend}
                disabled={isResending || isVerifying}
                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? "Sending..." : "Did not receive it? Re-Send Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#E5E5E5]">
          <p className="text-sm text-gray-700">Loading verification...</p>
        </div>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}


