"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthSidebar from '@/components/AuthSidebar';
import UnderlineInput from '@/components/UnderlineInput';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            router.push('/');
        } catch (error) {
            console.error('Login error:', error);
            alert(error instanceof Error ? error.message : 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#E5E5E5]">
            <AuthSidebar />
            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
                <div className="w-full max-w-lg">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Welcome Back</h2>
                    <Link href="/introduction" className="mb-4 text-xs font-semibold text-gray-600 cursor-pointer hover:text-black">
                        ← Back
                    </Link>
                    <div className="bg-white rounded-[2.5rem] px-10 py-16 shadow-lg w-full relative">
                        <div className="mb-8">
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
                                <UnderlineInput 
                                    label="Password" 
                                    required 
                                    type="password" 
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
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

