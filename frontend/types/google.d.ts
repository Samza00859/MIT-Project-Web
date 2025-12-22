interface GoogleAccounts {
    id: {
        initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        prompt: () => void;
    };
}

interface GoogleCredentialResponse {
    credential: string;
}

declare global {
    interface Window {
        google?: {
            accounts: GoogleAccounts;
        };
    }
}

export {};

