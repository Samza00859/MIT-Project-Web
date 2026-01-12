"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthSidebar from "@/components/AuthSidebar";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register(name, email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E8ECF3] font-['Inter','Montserrat',sans-serif]">
      <AuthSidebar />

      <div className="flex-1 flex flex-col justify-center items-center px-4 md:px-10 py-12 relative">
        <div className="w-full max-w-3xl relative">
          <Link
            href="/introduction"
            className="absolute -top-12 left-0 text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition"
          >
            ← Back
          </Link>

          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
              Create Your Account
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Join our AI-powered trading platform with secure onboarding and streamlined access.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[28px] px-8 md:px-12 py-12 shadow-[0_28px_80px_rgba(15,23,42,0.14)] w-full border border-white/60">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="w-full relative">
                <input
                  className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/25 focus:bg-white placeholder-transparent"
                  placeholder="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0f172a]">
                  Name<span className="text-red-500">*</span>
                </label>
              </div>

              {/* Email Field */}
              <div className="w-full relative">
                <input
                  className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/25 focus:bg-white placeholder-transparent"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0f172a]">
                  Email<span className="text-red-500">*</span>
                </label>
              </div>

              {/* Password Field with Eye Toggle */}
              <div className="w-full relative">
                <input
                  className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 pr-12 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/25 focus:bg-white placeholder-transparent"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password Field with Eye Toggle */}
              <div className="w-full relative">
                <input
                  className="peer w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 pt-5 pb-2.5 pr-12 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/25 focus:bg-white placeholder-transparent"
                  placeholder="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <label className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0f172a]">
                  Confirm Password<span className="text-red-500">*</span>
                </label>
                {/* Eye Icon Toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-2">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-7 md:px-8 py-3 rounded-xl bg-linear-to-br from-[#10b981] to-[#059669] text-white font-semibold text-base shadow-[0_12px_28px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_36px_rgba(16,185,129,0.45)] hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 transition ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {isSubmitting ? "Creating Account..." : "Sign up"}
                </button>
                <Link href="/Auth/login">
                  <button
                    type="button"
                    className="px-7 md:px-8 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold text-base bg-white hover:border-[#10b981] hover:text-[#0f172a] hover:shadow-[0_10px_26px_rgba(16,185,129,0.18)] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 transition"
                  >
                    Sign in
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </div>
        <div className="w-full max-w-3xl mt-6 px-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>
          <div className="flex justify-center gap-4 md:gap-5 flex-wrap">
            {/* Google – match login style */}
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-[#10b981] hover:shadow-[0_8px_20px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 transition"
              aria-label="Continue with Google"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                width="20"
                height="20"
                viewBox="0 0 48 48"
                className="block"
              >
                <path fill="#EA4335" d="M24 9.5c3.09 0 5.25 1.34 6.46 2.46l4.73-4.73C31.98 4.03 28.27 2.5 24 2.5 14.91 2.5 7.09 7.98 3.54 15.94l5.88 4.56C11.2 14.85 16.95 9.5 24 9.5Z" />
                <path fill="#34A853" d="M46.5 24c0-1.6-.14-2.77-.44-3.98H24v7.2h12.83C35.9 31.7 30.5 36.5 24 36.5c-7.05 0-12.8-5.35-14.58-12.25l-5.88 4.56C7.09 40.02 14.91 45.5 24 45.5c12.75 0 22.5-8.75 22.5-21.5Z" />
                <path fill="#FBBC05" d="M9.42 24c0-1.25.2-2.45.55-3.58l-5.88-4.56C2.74 17.58 2 20.71 2 24c0 3.29.74 6.42 2.09 9.14l5.88-4.56C9.62 26.45 9.42 25.25 9.42 24Z" />
                <path fill="#4285F4" d="M24 45.5c6.5 0 11.95-2.14 15.93-5.81l-5.88-4.56C31.52 37.72 28.07 39 24 39c-7.05 0-12.8-4.55-14.58-11.45l-5.88 4.56C7.09 40.02 14.91 45.5 24 45.5Z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1877f2] bg-[#1877f2] text-sm font-semibold text-white hover:brightness-95 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1877f2]/40 transition"
              aria-label="Continue with Facebook"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 border border-white/40 text-white font-bold text-xs">
                f
              </span>
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-sm font-semibold text-white hover:brightness-95 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-black/30 transition"
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
  );
}




