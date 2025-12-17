"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

interface PasswordStrengthInfo {
    strength: PasswordStrength;
    percentage: number;
    color: string;
    message: string;
}

function calculatePasswordStrength(password: string): PasswordStrengthInfo {
    if (!password) {
        return {
            strength: 'weak',
            percentage: 0,
            color: 'bg-gray-300',
            message: ''
        };
    }

    let strength = 0;
    let checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };

    if (checks.length) strength += 1;
    if (checks.lowercase) strength += 1;
    if (checks.uppercase) strength += 1;
    if (checks.number) strength += 1;
    if (checks.special) strength += 1;

    let passwordStrength: PasswordStrength;
    let percentage: number;
    let color: string;
    let message: string;

    if (strength <= 2) {
        passwordStrength = 'weak';
        percentage = 25;
        color = 'bg-red-500';
        message = 'Weak password - Should have at least 8 characters with uppercase, numbers, or special characters';
    } else if (strength === 3) {
        passwordStrength = 'fair';
        percentage = 50;
        color = 'bg-orange-500';
        message = 'Fair password - Add uppercase letters, numbers, or special characters for better security';
    } else if (strength === 4) {
        passwordStrength = 'good';
        percentage = 75;
        color = 'bg-yellow-500';
        message = 'Good password - Add special characters for enhanced security';
    } else {
        passwordStrength = 'strong';
        percentage = 100;
        color = 'bg-green-500';
        message = 'Strong password ✓';
    }

    return {
        strength: passwordStrength,
        percentage,
        color,
        message
    };
}

export default function RegisterPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

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
                            <div className="mb-6 w-full">
                                <label className="block text-xs font-bold text-gray-800 mb-2">
                                    Password<span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {password && (
                                    <div className="mt-2">
                                        {/* Password Strength Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{ width: `${passwordStrength.percentage}%` }}
                                            />
                                        </div>
                                        {/* Password Strength Message */}
                                        <p className={`text-xs ${passwordStrength.strength === 'strong' ? 'text-green-600' : passwordStrength.strength === 'good' ? 'text-yellow-600' : passwordStrength.strength === 'fair' ? 'text-orange-600' : 'text-red-600'}`}>
                                            {passwordStrength.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mb-6 w-full">
                                <label className="block text-xs font-bold text-gray-800 mb-2">
                                    Confirm Password<span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                                )}
                            </div>
                            {/* Register Button inside white panel */}
                            <div className="flex justify-end mt-6">
                                <button className="px-8 py-2 rounded-full bg-gray-400 text-gray-800 font-semibold text-sm hover:bg-gray-500 transition">
                                    Register
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Or Separator */}
                    <div className="flex items-center justify-center my-6">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-sm text-gray-600">or</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Google Sign In Button */}
                    <div className="flex justify-center">
                        <button 
                            type="button"
                            className="bg-white border border-gray-300 rounded-full px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}