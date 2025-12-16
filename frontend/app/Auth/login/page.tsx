import React from 'react';
import Link from 'next/link';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen bg-[#E5E5E5]">
            {/* Left Side */}
            <AuthSidebar />

            {/* Right Side */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">

                <div className="w-full max-w-lg">

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Welcome Back</h2>

                    {/* Back Link */}
                    <Link href="/introduction" className="mb-4 text-xs font-semibold text-gray-600 cursor-pointer hover:text-black">
                        ← Back
                    </Link>

                    <div className="bg-white rounded-[2.5rem] px-10 py-16 shadow-lg w-full relative">
                        <div className="mb-8">
                            <p className="text-xs text-gray-500 mb-6">Log in to your account</p>
                            <form>
                                <UnderlineInput label="Email" required type="email" />
                                <UnderlineInput label="Password" required type="password" />

                                {/* Login Button Centered inside card at bottom */}
                                <div className="flex justify-center mt-12">
                                    <button className="bg-black text-white rounded-full px-12 py-3 text-sm font-semibold hover:bg-gray-800 transition shadow-lg">
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Optional: Add Link to register if needed */}
                    <div className="text-center mt-6 text-sm text-gray-600">
                        Don't have an account? <Link href="/register" className="font-bold underline">Sign up</Link>
                    </div>

                </div>
            </div>
        </div>
    );
}