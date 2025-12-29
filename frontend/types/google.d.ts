interface GoogleAccounts {
    id: {
        initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        prompt: () => void;
        renderButton: (element: HTMLElement, config: any) => void;
    };
    oauth2: {
        initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
        }) => {
            requestAccessToken: () => void;
        };
    };
}

interface GoogleCredentialResponse {
    credential: string;
}

interface GoogleTokenResponse {
    access_token?: string;
    error?: string;
}

declare global {
    interface Window {
        google?: {
            accounts: GoogleAccounts;
        };
    }
}

export {};

