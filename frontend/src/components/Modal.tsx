import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
    title: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}

/** Accessible dialog: traps initial focus, closes on Escape or backdrop click, restores focus. */
export function Modal({ title, onClose, children, wide }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            previous?.focus();
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
            onMouseDown={onClose}
        >
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onMouseDown={(e) => e.stopPropagation()}
                className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none shadow-2xl outline-none sm:rounded-xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
            >
                {children}
            </div>
        </div>
    );
}
