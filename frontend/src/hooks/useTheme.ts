import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** Keeps the `dark` class on <html> in sync with the chosen theme (and the OS in auto mode). */
export function useThemeEffect() {
    const theme = useAppStore((s) => s.theme);
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () =>
            document.documentElement.classList.toggle(
                'dark',
                theme === 'dark' || (theme === 'auto' && media.matches),
            );
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);
}
