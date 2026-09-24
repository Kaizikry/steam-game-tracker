import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useMe } from '../hooks/useApi';
import { api, errorMessage, isUnauthorized } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';

/**
 * Ensures there is an anonymous session before rendering the app. There's no login in the MVP:
 * the token saved in this browser *is* the account, so we warn if an old one stops working.
 */
export function SessionGate({ children }: { children: ReactNode }) {
    const { token, setToken } = useAppStore();
    const [createError, setCreateError] = useState<string | null>(null);
    const me = useMe(!!token);
    const qc = useQueryClient();

    useEffect(() => {
        if (token) return;
        let cancelled = false;
        api.createSession()
            .then((s) => !cancelled && setToken(s.token))
            .catch((e) => !cancelled && setCreateError(errorMessage(e)));
        return () => {
            cancelled = true;
        };
    }, [token, setToken]);

    useEffect(() => {
        if (me.error && isUnauthorized(me.error)) {
            toast.error(
                'Your saved session is no longer valid, so a new empty library was started. Restore a backup from Settings if you have one.',
            );
            qc.clear();
            setToken(null);
        }
    }, [me.error, qc, setToken]);

    const failure =
        createError ?? (me.error && !isUnauthorized(me.error) ? errorMessage(me.error) : null);
    if (failure) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="card max-w-md space-y-3 p-6 text-center">
                    <h1 className="text-xl font-bold">Can't connect</h1>
                    <p className="muted">{failure}</p>
                    <button className="btn-primary" onClick={() => location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    if (!token || !me.data) {
        return (
            <div className="flex min-h-screen items-center justify-center" role="status">
                <span className="muted">Loading your library…</span>
            </div>
        );
    }
    return <>{children}</>;
}
