import type { Page } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SharedProps {
    auth: {
        user: User | null;
    };
}

declare module '@inertiajs/react' {
    export function usePage<T = Record<string, unknown>>(): Page<SharedProps & T>;
}
