"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthSidebar from "@/components/AuthSidebar";
import UnderlineInput from "@/components/UnderlineInput";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-[#E5E5E5]">
      <AuthSidebar />
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-2xl relative">
          <Link
            href="/introduction"
            className="absolute -top-8 left-0 text-base font-semibold text-gray-600 cursor-pointer hover:text-black"
          >
            ← Back
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Welcome Back
          </h2>

          <div className="bg-white rounded-[2.5rem] px-12 py-14 shadow-lg w-full">
            <div className="mb-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-6 w-full relative">
                  <input
                    className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30 focus:bg-white placeholder-transparent"
                    placeholder="Email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0f172a]">
                    Email<span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="mb-6 w-full relative">
                  <input
                    className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 pr-12 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30 focus:bg-white placeholder-transparent"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0f172a]">
                    Password<span className="text-red-500">*</span>
                  </label>
                  {/* Eye Icon Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      /* Eye Open - Password Visible */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      /* Eye Closed - Password Hidden */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center mb-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Remember me
                    </span>
                  </label>
                  <span className="text-sm text-blue-500">
                    Forgot password
                  </span>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="flex justify-center mt-12">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-black text-white rounded-full px-12 py-3 text-sm font-semibold transition transform hover:scale-[1.02] hover:shadow-[0_10px_26px_rgba(16,185,129,0.28)] ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-6 mb-4 w-full">
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-center gap-4 md:gap-5 flex-wrap">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-[#10b981] hover:shadow-[0_8px_20px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 transition"
                aria-label="Continue with Google"
              >
                <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 48 48" className="block">
                  <path fill="#EA4335" d="M24 9.5c3.09 0 5.25 1.34 6.46 2.46l4.73-4.73C31.98 4.03 28.27 2.5 24 2.5 14.91 2.5 7.09 7.98 3.54 15.94l5.88 4.56C11.2 14.85 16.95 9.5 24 9.5Z" />
                  <path fill="#34A853" d="M46.5 24c0-1.6-.14-2.77-.44-3.98H24v7.2h12.83C35.9 31.7 30.5 36.5 24 36.5c-7.05 0-12.8-5.35-14.58-12.25l-5.88 4.56C7.09 40.02 14.91 45.5 24 45.5c12.75 0 22.5-8.75 22.5-21.5Z" />
                  <path fill="#FBBC05" d="M9.42 24c0-1.25.2-2.45.55-3.58l-5.88-4.56C2.74 17.58 2 20.71 2 24c0 3.29.74 6.42 2.09 9.14l5.88-4.56C9.62 26.45 9.42 25.25 9.42 24Z" />
                  <path fill="#4285F4" d="M24 45.5c6.5 0 11.95-2.14 15.93-5.81l-5.88-4.56C31.52 37.72 28.07 39 24 39c-7.05 0-12.8-4.55-14.58-11.45l-5.88 4.56C7.09 40.02 14.91 45.5 24 45.5Z" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1877f2] bg-[#1877f2] text-sm font-semibold text-white hover:brightness-95 hover:-translate-y-0.5 hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-[#1877f2]/40 transition"
                aria-label="Continue with Facebook"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 border border-white/40 text-white font-bold text-xs">
                  f
                </span>
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-sm font-semibold text-white hover:brightness-95 hover:-translate-y-0.5 hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-black/30 transition"
                aria-label="Continue with X"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs border border-black/10 shadow-sm">
                  X
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


