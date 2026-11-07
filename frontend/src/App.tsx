import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SessionGate } from './components/SessionGate';
import { useSettings } from './hooks/useApi';
import { useThemeEffect } from './hooks/useTheme';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { useAppStore } from './store/useAppStore';

/** Adopts theme and view preferences saved on the server (e.g. set from another browser). */
function SyncPreferences() {
    const { data } = useSettings();
    useEffect(() => {
        if (!data) return;
        const { setTheme, setViewType } = useAppStore.getState();
        setTheme(data.theme);
        setViewType(data.defaultViewType);
    }, [data]);
    return null;
}

export default function App() {
    useThemeEffect();
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <SessionGate>
                <SyncPreferences />
                <Routes>
                    <Route element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="games" element={<GamesPage />} />
                        <Route path="stats" element={<StatsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </SessionGate>
        </BrowserRouter>
    );
}
