import { useEffect } from 'react';

const isTyping = (el: EventTarget | null) =>
    el instanceof HTMLElement &&
    (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Registers single-key shortcuts that are ignored while the user is typing in a field. */
export function useKeyboardShortcuts(map: Record<string, () => void>, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
            const handler = map[e.key];
            if (handler) {
                e.preventDefault();
                handler();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [map, enabled]);
}
