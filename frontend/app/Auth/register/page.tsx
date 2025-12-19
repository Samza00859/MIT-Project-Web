"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';
import { buildApiUrl, mapFetchError } from '@/lib/api';

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
        message = 'Weak password - should have at least 8 characters with uppercase, numbers, or special characters';
    } else if (strength === 3) {
        passwordStrength = 'fair';
        percentage = 50;
        color = 'bg-orange-500';
        message = 'Fair password - add uppercase, numbers, or special characters for better security';
    } else if (strength === 4) {
        passwordStrength = 'good';
        percentage = 75;
        color = 'bg-yellow-500';
        message = 'Good password - add special characters for more security';
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
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!name.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (!email.trim()) {
            setError('Please enter your email.');
            return;
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Invalid email format.');
            return;
        }
        if (!password) {
            setError('Please enter a password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (passwordStrength.strength === 'weak') {
            setError('Password is too weak. Please use a stronger password.');
            return;
        }

        setIsLoading(true);

        try {
            const requestUrl = buildApiUrl('/api/auth/register');
            
            // Check if backend is reachable first
            console.log('Attempting to connect to:', requestUrl);
            console.log('Request payload:', { email: email.trim(), password: '***' });
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            let response: Response;
            try {
                const requestBody = JSON.stringify({
                    email: email.trim(),
                    password: password,
                });
                
                console.log('Sending request to:', requestUrl);
                console.log('Request body:', { email: email.trim(), password: '***' });
                
                response = await fetch(requestUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: requestBody,
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit',
                } as RequestInit);
                
                console.log('Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
            } catch (fetchError: unknown) {
                clearTimeout(timeoutId);
                
                // Handle network errors
                const error = fetchError as Error;
                console.error('Fetch error details:', {
                    name: error?.name,
                    message: error?.message,
                    stack: error?.stack,
                    error: fetchError
                });
                
                if (error?.name === 'AbortError') {
                    throw new Error('Request timed out. Please ensure the backend is running at http://localhost:8000');
                }
                throw new Error(mapFetchError(fetchError, '/api/auth/register'));
            }
            
            clearTimeout(timeoutId);

            // Log response details
            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage = 'Registration failed';
                let errorData: any = null;
                
                try {
                    const responseText = await response.text();
                    console.log('Response text:', responseText);
                    
                    if (responseText) {
                        errorData = JSON.parse(responseText);
                        errorMessage = errorData.detail || errorData.message || errorMessage;
                    }
                } catch (parseError) {
                    // If response is not JSON, use status text
                    console.error('Failed to parse response as JSON:', parseError);
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                
                // Provide more specific error messages
                if (response.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (response.status === 400) {
                    errorMessage = errorData?.detail || 'Invalid input. Please check your details.';
                } else if (response.status === 403) {
                    errorMessage = errorData?.detail || 'Not authorized.';
                } else if (response.status === 404) {
                    errorMessage = 'Endpoint /api/auth/register not found on backend (404).';
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Check if registration was successful
            if (data.message || data.email) {
                setSuccess(true);
                if (data.verification_required) {
                    const qp = new URLSearchParams({ email: email.trim() });
                    if (data.dev_verification_code) qp.set("devCode", String(data.dev_verification_code));
                    setTimeout(() => router.push(`/Auth/verify-code?${qp.toString()}`), 600);
                } else {
                    setTimeout(() => router.push(`/Auth/login?registered=true`), 800);
                }
            } else {
                throw new Error('Registration response is invalid');
            }
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            // Show user-friendly error messages
            if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to the server. Please ensure the backend is running.';
            } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                errorMessage = 'This email is already in use. Please use another email.';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#E5E5E5]">
            {/* Left Side */}
            <AuthSidebar />

            {/* Right Side */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative">

                {/* Mobile Logo / Header could go here if needed */}

                {/* Form Card */}
                <div className="w-full max-w-2xl relative">

                    {/* Back Link */}
                    <Link href="/introduction" className="absolute -top-8 left-0 text-base font-semibold text-gray-600 cursor-pointer hover:text-black">
                        ← Back
                    </Link>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center capitalize">create your account</h2>

                    <div className="bg-white rounded-[2.5rem] px-12 py-14 shadow-lg w-full">
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800 font-semibold">
                                    Registration successful!
                                </p>
                                <p className="text-xs text-green-600 mt-2">
                                    Your account has been created. Redirecting you to login...
                                </p>
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6 w-full">
                                <label className="block text-xs font-bold text-gray-800 mb-2">
                                    Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6 w-full">
                                <label className="block text-xs font-bold text-gray-800 mb-2">
                                    Email<span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
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
                                <div className="relative">
                                    <input
                                        className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                                )}
                            </div>
                            
                            {/* Buttons Section */}
                            <div className="flex justify-end gap-4 mt-8">
                                <button 
                                    type="submit"
                                    disabled={isLoading || success}
                                    className="px-8 py-2 rounded-full bg-gray-400 text-gray-800 font-semibold text-sm hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Signing up...' : 'Sign Up'}
                                </button>
                                <Link href="/Auth/login">
                                    <button 
                                        type="button"
                                        className="px-8 py-2 rounded-full bg-gray-500 text-white font-semibold text-sm hover:bg-gray-600 transition"
                                    >
                                        Sign In
                                    </button>
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Divider with "or" */}
                    <div className="mt-6 mb-4 w-full">
                        <div className="flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="w-full">
                        <div className="flex flex-wrap justify-center gap-3">
                            {/* Facebook */}
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#166FE5] transition shadow-md hover:shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </button>

                            {/* Apple ID */}
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.2 2.58-1.66 4.51-3.74 4.25z"/>
                                </svg>
                                Apple ID
                            </button>

                            {/* X (Twitter) */}
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                X
                            </button>

                            {/* LinkedIn */}
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0077B5] text-white text-sm font-semibold hover:bg-[#006399] transition shadow-md hover:shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                LinkedIn
                            </button>

                            {/* Yahoo */}
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#6001D2] text-white text-sm font-semibold hover:bg-[#4F00B8] transition shadow-md hover:shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                                    <path d="M223.69,141.06,167,284.23,111,141.06H14.93L120.76,390.19,82.19,480h94.17L317.43,141.06Zm105.4,203.56a35.59,35.59,0,1,0,35.59-35.59A35.59,35.59,0,0,0,329.09,344.62Z"/>
                                </svg>
                                Yahoo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}