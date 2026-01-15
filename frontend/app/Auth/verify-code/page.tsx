"use client";

import React from "react";
import Link from "next/link";
import AuthSidebar from "@/components/AuthSidebar";

export default function VerifyCodePage() {
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

          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Email Verification Disabled
          </h2>

          <div className="bg-white rounded-[2.5rem] px-12 py-14 shadow-lg w-full">
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                ระบบยืนยันอีเมล (Verify Code) ถูกปิดใช้งานแล้ว
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                ระบบบัญชีผู้ใช้และการยืนยันอีเมลถูกถอดออกจากโปรเจกต์นี้
                หน้านี้แสดงไว้เพื่อให้โครงสร้างหน้าเว็บยังคงอยู่เท่านั้น
              </p>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              ตอนนี้คุณสามารถใช้งานเว็บไซต์ในโหมดผู้เยี่ยมชมได้โดยไม่ต้องสมัครสมาชิก
              หรือยืนยันอีเมล
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href="/"
                className="bg-black text-white rounded-full px-10 py-3 text-sm font-semibold hover:bg-gray-800 transition shadow-lg"
              >
                กลับไปหน้าแรก
              </Link>
              <Link
                href="/introduction"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ดูคำแนะนำการใช้งานเว็บไซต์
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


















