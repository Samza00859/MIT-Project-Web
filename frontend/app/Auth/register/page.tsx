import React from 'react';
import Link from 'next/link';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen bg-[#E5E5E5]">
            {/* Left Side */}
            <AuthSidebar />

            {/* Right Side */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative">

                {/* Mobile Logo / Header could go here if needed */}

                {/* Form Card */}
                <div className="w-full max-w-lg">

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center capitalize">create your account</h2>

                    {/* Back Link */}
                    <Link href="/introduction" className="mb-4 text-xs font-semibold text-gray-600 cursor-pointer hover:text-black">
                        ← Back
                    </Link>

                    <div className="bg-white rounded-[2.5rem] px-10 py-12 shadow-lg w-full">
                        <form>
                            <UnderlineInput label="Name" type="text" placeholder="" />
                            <UnderlineInput label="Email" required type="email" />
                            <UnderlineInput label="Password" required type="password" />
                            <UnderlineInput label="Confirm Password" required type="password" />
                        </form>
                    </div>

                    {/* Buttons Section (Outside the white card based on image flow, or inside depending on interpretation. 
                In the image, buttons seem to float below or at bottom right of form area) */}
                    <div className="flex justify-end gap-4 mt-6 mr-4">
                        <button className="px-8 py-2 rounded-full bg-gray-400 text-gray-800 font-semibold text-sm hover:bg-gray-500 transition">
                            Sign Up
                        </button>
                        <Link href="/login">
                            <button className="px-8 py-2 rounded-full bg-gray-500 text-white font-semibold text-sm hover:bg-gray-600 transition">
                                Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}