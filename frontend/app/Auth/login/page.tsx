"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';
import { buildApiUrl, mapFetchError } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);

    // Check for query parameters
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setSuccessMessage('Registration successful! You can now sign in.');
        }
        if (params.get('verified') === 'true') {
            if (params.get('message') === 'already_verified') {
                setSuccessMessage('Your email is already verified. You can sign in.');
            } else {
                setSuccessMessage('Email verified successfully! You can now sign in.');
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setNeedsVerification(false);

        try {
            const requestUrl = buildApiUrl('/api/auth/login');
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            let response: Response;
            try {
                response = await fetch(requestUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit',
                } as RequestInit);
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
                throw new Error(mapFetchError(fetchError, '/api/auth/login'));
            }
            
            clearTimeout(timeoutId);

            // Log response details
            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage = 'Login failed';
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
                
                if (response.status === 404) {
                    errorMessage = 'Endpoint /api/auth/login not found on backend (404).';
                }
                
                // Provide more specific error messages
                if (response.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (response.status === 401) {
                    errorMessage = errorData?.detail || 'Incorrect email or password.';
                } else if (response.status === 400) {
                    errorMessage = errorData?.detail || 'Invalid input. Please check your details.';
                } else if (response.status === 403) {
                    errorMessage = errorData?.detail || 'Not authorized.';
                    if ((errorMessage || "").toLowerCase().includes("not verified")) {
                        setNeedsVerification(true);
                    }
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            router.push('/');
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            // Show user-friendly error messages
            if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
                setError('Cannot connect to the server. Please ensure the backend is running.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#E5E5E5]">
            <AuthSidebar />
            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
                <div className="w-full max-w-2xl relative">
                    <Link href="/introduction" className="absolute -top-8 left-0 text-base font-semibold text-gray-600 cursor-pointer hover:text-black">
                        ← Back
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Welcome Back</h2>
                    <div className="bg-white rounded-[2.5rem] px-12 py-14 shadow-lg w-full">
                        <div className="mb-8">
                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{successMessage}</p>
                                </div>
                            )}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{error}</p>
                                    {needsVerification && email && (
                                        <p className="text-sm text-red-800 mt-2">
                                            <Link
                                                href={`/Auth/verify-code?email=${encodeURIComponent(email)}`}
                                                className="underline font-semibold"
                                            >
                                                Verify your email
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mb-6">Log in to your account</p>
                            <form onSubmit={handleSubmit}>
                                <UnderlineInput 
                                    label="Email" 
                                    required 
                                    type="email" 
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="mb-6 w-full">
                                    <label className="block text-sm font-bold text-gray-800 mb-3">
                                        Password<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-transparent border-b-2 border-gray-400 text-gray-800 py-2 text-base focus:outline-none focus:border-black transition-colors"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                {/* Remember me and Forgot password */}
                                <div className="flex justify-between items-center mb-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Remember me</span>
                                    </label>
                                    <Link href="/Auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 underline">
                                        I forgot my password or I can't log in.
                                    </Link>
                                </div>
                                
                                <div className="flex justify-center mt-12">
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-black text-white rounded-full px-12 py-3 text-sm font-semibold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="text-center mt-6 text-sm text-gray-600">
                        Don't have an account? <Link href="/Auth/register" className="font-bold underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

