interface FacebookSDK {
    init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
    }) => void;
    login: (callback: (response: FacebookLoginResponse) => void, options?: { scope: string }) => void;
    api: (path: string, params: object, callback: (response: unknown) => void) => void;
    getLoginStatus: (callback: (response: FacebookLoginStatusResponse) => void) => void;
}

interface FacebookLoginResponse {
    authResponse?: {
        accessToken: string;
        userID: string;
        expiresIn: number;
    };
    status?: string;
}

interface FacebookLoginStatusResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
        accessToken: string;
        userID: string;
    };
}

declare global {
    interface Window {
        FB?: FacebookSDK;
    }
}

export { };

















