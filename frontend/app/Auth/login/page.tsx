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
    const [googleLoading, setGoogleLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);

    // Load remembered email on component mount
    React.useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_email');
        const rememberMeStatus = localStorage.getItem('remember_me') === 'true';
        
        if (rememberedEmail && rememberMeStatus) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleGoogleCredentialResponse = React.useCallback(async (response: any) => {
        setGoogleLoading(true);
        setError('');
        setNeedsVerification(false);

        try {
            // Decode the JWT token to get user info
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const userInfo = JSON.parse(jsonPayload);

            // Call backend to login with Google
            const requestUrl = buildApiUrl('/api/auth/google');
            const backendResponse = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    credential: response.credential,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                }),
                mode: 'cors',
                credentials: 'omit',
            });

            if (!backendResponse.ok) {
                const errorData = await backendResponse.json().catch(() => ({ detail: 'Google login failed' }));
                throw new Error(errorData.detail || 'Google login failed');
            }

            const data = await backendResponse.json();

            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                // Handle Remember Me for Google login
                if (rememberMe) {
                    localStorage.setItem('remembered_email', userInfo.email);
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('remembered_email');
                    localStorage.removeItem('remember_me');
                }

                router.push('/');
            } else {
                throw new Error('No access token received');
            }
        } catch (error) {
            console.error('Google login error:', error);
            let errorMessage = 'Google login failed. Please try again.';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to the server. Please ensure the backend is running.';
            }

            setError(errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    }, [router, rememberMe]);

    // Load Google Identity Services
    React.useEffect(() => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        if (!googleClientId) {
            console.warn('Google Client ID is not configured. Google Sign-In will not work.');
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            // Script already loaded, just initialize
            if (window.google && window.google.accounts) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleCredentialResponse,
                    });
                } catch (error) {
                    console.error('Failed to initialize Google Sign-In:', error);
                }
            }
            return;
        }

        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && window.google.accounts) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleCredentialResponse,
                    });
                } catch (error) {
                    console.error('Failed to initialize Google Sign-In:', error);
                }
            }
        };
        script.onerror = () => {
            console.error('Failed to load Google Identity Services script');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script on unmount
            const scriptToRemove = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
        };
    }, [handleGoogleCredentialResponse]);

    // Load Facebook SDK
    React.useEffect(() => {
        const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        
        if (!facebookAppId) {
            console.warn('Facebook App ID is not configured. Facebook Sign-In will not work.');
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
        if (existingScript) {
            // Script already loaded, just initialize
            if (window.FB) {
                try {
                    window.FB.init({
                        appId: facebookAppId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0'
                    });
                } catch (error) {
                    console.error('Failed to initialize Facebook SDK:', error);
                }
            }
            return;
        }

        // Load Facebook SDK script
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            if (window.FB) {
                try {
                    window.FB.init({
                        appId: facebookAppId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0'
                    });
                } catch (error) {
                    console.error('Failed to initialize Facebook SDK:', error);
                }
            }
        };
        script.onerror = () => {
            console.error('Failed to load Facebook SDK script');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script on unmount
            const scriptToRemove = document.querySelector('script[src*="connect.facebook.net"]');
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
        };
    }, []);

    const handleFacebookLogin = () => {
        const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        
        if (!facebookAppId) {
            setError('Facebook Sign-In is not configured. Please set NEXT_PUBLIC_FACEBOOK_APP_ID in your environment variables.');
            return;
        }

        if (!window.FB) {
            setError('Facebook SDK is not available. Please wait a moment and try again.');
            return;
        }

        setFacebookLoading(true);
        setError('');
        setNeedsVerification(false);

        try {
            window.FB.login(async (response: any) => {
                if (response.authResponse) {
                    // User logged in successfully
                    const accessToken = response.authResponse.accessToken;
                    
                    try {
                        // Get user info from Facebook
                        window.FB.api('/me', { fields: 'id,name,email,picture' }, async (userInfo: any) => {
                            if (userInfo.error) {
                                setError('Failed to get user info from Facebook: ' + userInfo.error.message);
                                setFacebookLoading(false);
                                return;
                            }

                            try {
                                // Call backend to login with Facebook
                                const requestUrl = buildApiUrl('/api/auth/facebook');
                                const backendResponse = await fetch(requestUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        access_token: accessToken,
                                        email: userInfo.email,
                                        name: userInfo.name,
                                        picture: userInfo.picture?.data?.url,
                                        facebook_id: userInfo.id,
                                    }),
                                    mode: 'cors',
                                    credentials: 'omit',
                                });

                                // Read response text first (can only read once)
                                const responseText = await backendResponse.text();
                                
                                if (!backendResponse.ok) {
                                    let errorMessage = 'Facebook login failed';
                                    try {
                                        const errorData = JSON.parse(responseText);
                                        errorMessage = errorData.detail || errorData.message || errorMessage;
                                    } catch (e) {
                                        errorMessage = `Server error: ${backendResponse.status} ${backendResponse.statusText}`;
                                    }
                                    throw new Error(errorMessage);
                                }

                                // Parse successful response
                                const data = JSON.parse(responseText);

                                if (data.access_token) {
                                    localStorage.setItem('access_token', data.access_token);
                                    if (data.user) {
                                        localStorage.setItem('user', JSON.stringify(data.user));
                                    }

                                    // Handle Remember Me for Facebook login
                                    if (rememberMe) {
                                        localStorage.setItem('remembered_email', userInfo.email);
                                        localStorage.setItem('remember_me', 'true');
                                    } else {
                                        localStorage.removeItem('remembered_email');
                                        localStorage.removeItem('remember_me');
                                    }

                                    router.push('/');
                                } else {
                                    throw new Error('No access token received');
                                }
                            } catch (error) {
                                console.error('Facebook login error:', error);
                                let errorMessage = 'Facebook login failed. Please try again.';
                                if (error instanceof Error) {
                                    errorMessage = error.message;
                                }
                                setError(errorMessage);
                            } finally {
                                setFacebookLoading(false);
                            }
                        });
                    } catch (error) {
                        console.error('Failed to get Facebook user info:', error);
                        setError('Failed to get user info from Facebook. Please try again.');
                        setFacebookLoading(false);
                    }
                } else {
                    // User cancelled login
                    setFacebookLoading(false);
                }
            }, { scope: 'email,public_profile' });
        } catch (error) {
            console.error('Failed to initiate Facebook login:', error);
            setError('Failed to open Facebook login. Please try again.');
            setFacebookLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        if (!googleClientId) {
            setError('Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.');
            return;
        }

        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
            setError('Google Sign-In is not available. Please wait a moment and try again.');
            return;
        }

        try {
            // Use OAuth2 flow for custom button
            window.google.accounts.oauth2.initTokenClient({
                client_id: googleClientId,
                scope: 'email profile',
                callback: async (response: any) => {
                    if (response.error) {
                        setError('Google Sign-In failed: ' + response.error);
                        return;
                    }
                    
                    // Get user info using access token
                    try {
                        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                        
                        if (!userInfoResponse.ok) {
                            throw new Error('Failed to get user info from Google');
                        }
                        
                        const userInfo = await userInfoResponse.json();
                        
                        if (!userInfo.email) {
                            throw new Error('Email not found in Google account');
                        }
                        
                        // Call backend to login with Google
                        const requestUrl = buildApiUrl('/api/auth/google');
                        const backendResponse = await fetch(requestUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify({
                                access_token: response.access_token,
                                email: userInfo.email,
                                name: userInfo.name,
                                picture: userInfo.picture,
                            }),
                            mode: 'cors',
                            credentials: 'omit',
                        });

                        // Read response text first (can only read once)
                        const responseText = await backendResponse.text();
                        
                        if (!backendResponse.ok) {
                            let errorMessage = 'Google login failed';
                            try {
                                const errorData = JSON.parse(responseText);
                                errorMessage = errorData.detail || errorData.message || errorMessage;
                            } catch (e) {
                                // If not JSON, use status text
                                errorMessage = `Server error: ${backendResponse.status} ${backendResponse.statusText}`;
                            }
                            throw new Error(errorMessage);
                        }

                        // Parse successful response
                        const data = JSON.parse(responseText);

                        if (data.access_token) {
                            localStorage.setItem('access_token', data.access_token);
                            if (data.user) {
                                localStorage.setItem('user', JSON.stringify(data.user));
                            }

                            // Handle Remember Me for Google login
                            if (rememberMe) {
                                localStorage.setItem('remembered_email', userInfo.email);
                                localStorage.setItem('remember_me', 'true');
                            } else {
                                localStorage.removeItem('remembered_email');
                                localStorage.removeItem('remember_me');
                            }

                            router.push('/');
                        } else {
                            throw new Error('No access token received');
                        }
                    } catch (error) {
                        console.error('Google login error:', error);
                        let errorMessage = 'Google login failed. Please try again.';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        setError(errorMessage);
                    }
                },
            }).requestAccessToken();
        } catch (error) {
            console.error('Failed to initiate Google Sign-In:', error);
            setError('Failed to open Google Sign-In. Please try again.');
        }
    };

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
                
                // Handle Remember Me functionality
                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('remembered_email');
                    localStorage.removeItem('remember_me');
                }
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
                                            onChange={(e) => {
                                                setRememberMe(e.target.checked);
                                                // If unchecking, remove stored data immediately
                                                if (!e.target.checked) {
                                                    localStorage.removeItem('remembered_email');
                                                    localStorage.removeItem('remember_me');
                                                }
                                            }}
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
                            {/* Google */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading || isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 border border-gray-300 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </button>

                            {/* Facebook */}
                            <button
                                type="button"
                                onClick={handleFacebookLogin}
                                disabled={facebookLoading || googleLoading || isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#166FE5] transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
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

                    <div className="text-center mt-6 text-sm text-gray-600">
                        Don't have an account? <Link href="/Auth/register" className="font-bold underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

