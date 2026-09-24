import { useToastStore } from '../store/useToastStore';

const styles = {
    success: 'border-emerald-500/60',
    error: 'border-red-500/70',
    info: 'border-sky-500/60',
};

export function Toaster() {
    const { toasts, dismiss } = useToastStore();
    return (
        <div
            className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 md:bottom-6"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role={t.kind === 'error' ? 'alert' : 'status'}
                    className={`card pointer-events-auto flex max-w-md items-start gap-3 border-l-4 px-4 py-3 text-sm shadow-lg ${styles[t.kind]}`}
                >
                    <span className="flex-1">{t.message}</span>
                    <button
                        className="muted hover:text-current"
                        onClick={() => dismiss(t.id)}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
