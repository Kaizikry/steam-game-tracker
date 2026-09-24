import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SteamImportForm } from '../components/SteamImportForm';
import { StatusDot } from '../components/StatusBadge';
import {
    invalidateLibrary,
    keys,
    useImportHistory,
    useMe,
    useSettings,
    useTags,
    useUpdateSettings,
} from '../hooks/useApi';
import { api, errorMessage } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';
import {
    DEFAULT_STATUS_LABELS,
    GAME_STATUSES,
    type FileImportResult,
    type Theme,
    type UserSettings,
    type ViewType,
} from '../types';
import { downloadBlob, formatRelative } from '../utils/format';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} className="card scroll-mt-20 space-y-4 p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

export function SettingsPage() {
    const { hash } = useLocation();
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }, [hash]);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Section id="steam" title="Steam library">
                <SteamImportForm />
                <ImportHistory />
            </Section>
            <Section id="appearance" title="Appearance">
                <AppearanceSettings />
            </Section>
            <Section id="goals" title="Columns & goals">
                <StatusLabelSettings />
            </Section>
            <Section id="tags" title="Tags">
                <TagManager />
            </Section>
            <Section id="data" title="Backup: export & import">
                <DataTransfer />
            </Section>
            <Section id="privacy" title="Privacy & your data">
                <PrivacySettings />
            </Section>
            <Section id="about" title="About & help">
                <div className="muted space-y-2 text-sm">
                    <p>Steam Game Tracker v0.1.0 · Not affiliated with Valve or Steam.</p>
                    <p>
                        Tips: drag cards between columns on the Games board, right-click a card for
                        quick actions, and press <kbd>?</kbd> anywhere to see keyboard shortcuts.
                        Re-import any time to pick up new games and play time; your statuses, notes
                        and tags are kept.
                    </p>
                </div>
            </Section>
        </div>
    );
}

function ImportHistory() {
    const { data = [] } = useImportHistory();
    if (data.length === 0) return null;
    return (
        <details className="text-sm">
            <summary className="cursor-pointer font-medium">Import history ({data.length})</summary>
            <ul className="mt-2 space-y-1">
                {data.map((h) => (
                    <li
                        key={h.id}
                        className={
                            h.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'muted'
                        }
                    >
                        {formatRelative(h.importedAt)} · {h.source.toUpperCase()} ·{' '}
                        {h.status === 'failed'
                            ? `failed: ${h.errorMessage}`
                            : `${h.totalGamesImported} games, ${h.newGamesAdded} new`}
                    </li>
                ))}
            </ul>
        </details>
    );
}

function AppearanceSettings() {
    const { theme, setTheme, viewType, setViewType } = useAppStore();
    const update = useUpdateSettings();
    const choose = <T,>(
        label: string,
        value: T,
        options: [T, string][],
        onChange: (v: T) => void,
    ) => (
        <div className="space-y-1.5">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                {options.map(([v, text]) => (
                    <button
                        key={String(v)}
                        role="radio"
                        aria-checked={value === v}
                        onClick={() => onChange(v)}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${value === v ? 'border-sky-500 bg-sky-500/15' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
    return (
        <div className="space-y-4">
            {choose<Theme>(
                'Theme',
                theme,
                [
                    ['dark', 'Dark'],
                    ['light', 'Light'],
                    ['auto', 'Match system'],
                ],
                (t) => {
                    setTheme(t);
                    update.mutate({ theme: t });
                },
            )}
            {choose<ViewType>(
                'Default games view',
                viewType,
                [
                    ['kanban', 'Board'],
                    ['grid', 'Grid'],
                    ['list', 'List'],
                ],
                (v) => {
                    setViewType(v);
                    update.mutate({ defaultViewType: v });
                },
            )}
        </div>
    );
}

function StatusLabelSettings() {
    const { data: settings } = useSettings();
    if (!settings) return <p className="muted text-sm">Loading…</p>;
    return <StatusLabelForm key={settings.updatedAt} settings={settings} />;
}

function StatusLabelForm({ settings }: { settings: UserSettings }) {
    const update = useUpdateSettings();
    const qc = useQueryClient();
    const [labels, setLabels] = useState<Record<string, string>>({
        ...DEFAULT_STATUS_LABELS,
        ...settings.statusLabels,
    });
    const [goal, setGoal] = useState(String(settings.monthlyCompletionGoal));

    const save = () =>
        update.mutate(
            {
                statusLabels: Object.fromEntries(
                    Object.entries(labels).map(([k, v]) => [
                        k,
                        v.trim() || DEFAULT_STATUS_LABELS[k as keyof typeof DEFAULT_STATUS_LABELS],
                    ]),
                ),
                monthlyCompletionGoal: Math.max(0, Math.min(100, Number(goal) || 0)),
            },
            {
                onSuccess: () => {
                    toast.success('Saved');
                    qc.invalidateQueries({ queryKey: keys.stats });
                },
                onError: (e) => toast.error(errorMessage(e)),
            },
        );

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {GAME_STATUSES.map((s) => (
                    <label key={s} className="space-y-1 text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                            <StatusDot status={s} /> Name for "{DEFAULT_STATUS_LABELS[s]}"
                        </span>
                        <input
                            className="input"
                            maxLength={30}
                            value={labels[s] ?? ''}
                            onChange={(e) => setLabels({ ...labels, [s]: e.target.value })}
                        />
                    </label>
                ))}
            </div>
            <label className="block max-w-xs space-y-1 text-sm">
                <span className="font-medium">Monthly completion goal</span>
                <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                />
                <span className="muted text-xs">
                    Games to complete each month. 0 turns the goal off.
                </span>
            </label>
            <button className="btn-primary" onClick={save} disabled={update.isPending}>
                Save
            </button>
        </div>
    );
}

function TagManager() {
    const { data: tags = [] } = useTags();
    const qc = useQueryClient();
    const refresh = () => invalidateLibrary(qc);
    const rename = useMutation({
        mutationFn: (v: { id: string; name?: string; color?: string }) => api.updateTag(v.id, v),
        onSuccess: refresh,
        onError: (e) => toast.error(errorMessage(e)),
    });
    const remove = useMutation({ mutationFn: api.deleteTag, onSuccess: refresh });

    if (tags.length === 0)
        return <p className="muted text-sm">No tags yet. Add them from a game's detail dialog.</p>;
    return (
        <ul className="space-y-2">
            {tags.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                    <input
                        type="color"
                        value={t.color}
                        onChange={(e) => rename.mutate({ id: t.id, color: e.target.value })}
                        className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                        aria-label={`Color for ${t.name}`}
                    />
                    <input
                        className="input"
                        defaultValue={t.name}
                        maxLength={50}
                        onBlur={(e) =>
                            e.target.value.trim() &&
                            e.target.value !== t.name &&
                            rename.mutate({ id: t.id, name: e.target.value.trim() })
                        }
                        aria-label={`Name of tag ${t.name}`}
                    />
                    <span className="muted w-20 shrink-0 text-right text-sm">
                        {t.gameCount} games
                    </span>
                    <button
                        className="btn-secondary"
                        onClick={() => confirm(`Delete tag "${t.name}"?`) && remove.mutate(t.id)}
                        aria-label={`Delete tag ${t.name}`}
                    >
                        ✕
                    </button>
                </li>
            ))}
        </ul>
    );
}

function DataTransfer() {
    const qc = useQueryClient();
    const [overwrite, setOverwrite] = useState(false);
    const [result, setResult] = useState<FileImportResult | null>(null);

    const exporter = useMutation({
        mutationFn: api.exportData,
        onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
        onError: (e) => toast.error(errorMessage(e)),
    });
    const importer = useMutation({
        mutationFn: async (file: File) => {
            const format = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
            return api.importFile({ format, content: await file.text(), overwrite });
        },
        onSuccess: (r) => {
            setResult(r);
            toast.success(`Import finished: ${r.created} added, ${r.updated} updated`);
            qc.invalidateQueries({ queryKey: keys.importHistory });
            return invalidateLibrary(qc);
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <p className="text-sm">
                    Download everything (statuses, notes, tags, play time). Keep a copy: it's your
                    backup.
                </p>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary"
                        onClick={() => exporter.mutate('json')}
                        disabled={exporter.isPending}
                    >
                        Export JSON
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => exporter.mutate('csv')}
                        disabled={exporter.isPending}
                    >
                        Export CSV
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="import-file">
                    Restore or merge from a file (.json or .csv)
                </label>
                <input
                    id="import-file"
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-white"
                    disabled={importer.isPending}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) importer.mutate(file);
                        e.target.value = '';
                    }}
                />
                <label className="flex items-start gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-sky-500"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                    />
                    <span>
                        Overwrite existing statuses and notes
                        <span className="muted block text-xs">
                            Off: only fills in games you haven't categorized or noted yet. Tags are
                            always added.
                        </span>
                    </span>
                </label>
                {importer.isPending && <p className="muted text-sm">Importing…</p>}
                {result && (
                    <div
                        className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-steam-900/60"
                        role="status"
                    >
                        <p>
                            {result.created} added · {result.updated} updated · {result.skipped}{' '}
                            unchanged/skipped
                        </p>
                        {result.errors.length > 0 && (
                            <details className="mt-2">
                                <summary className="cursor-pointer text-amber-700 dark:text-amber-300">
                                    {result.errors.length} rows had problems
                                </summary>
                                <ul className="mt-1 max-h-40 overflow-y-auto">
                                    {result.errors.map((e, i) => (
                                        <li key={i}>
                                            Row {e.row}: {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function PrivacySettings() {
    const { data: me } = useMe();
    const { data: settings } = useSettings();
    const update = useUpdateSettings();
    const qc = useQueryClient();
    const setToken = useAppStore((s) => s.setToken);

    const clear = useMutation({
        mutationFn: api.clearLibrary,
        onSuccess: () => {
            toast.success('Library cleared');
            return invalidateLibrary(qc);
        },
    });
    const deleteAccount = useMutation({
        mutationFn: api.deleteAccount,
        onSuccess: () => {
            qc.clear();
            setToken(null);
        },
    });

    return (
        <div className="space-y-4 text-sm">
            <div className="muted space-y-2">
                <p>
                    <strong className="text-current">What we store:</strong> the games in your
                    public Steam library (title, app ID, play time, last played), your Steam display
                    name and avatar, and what you add here (statuses, notes, tags, settings). No
                    password, email or Steam credentials, ever. Store details and achievements are
                    fetched from Steam's public APIs when you open a game.
                </p>
                <p>
                    <strong className="text-current">No account:</strong> your library is tied to a
                    private session key saved in this browser. Clearing site data or switching
                    devices starts a new library, so use <em>Export JSON</em> to back up and move
                    your data.
                </p>
                <p>
                    <strong className="text-current">No tracking:</strong> there's no analytics or
                    telemetry unless you opt in below.
                </p>
                <p className="text-xs">Session started {formatRelative(me?.createdAt)}.</p>
            </div>
            <label className="flex items-start gap-2">
                <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-sky-500"
                    checked={settings?.privacyOptIn ?? false}
                    onChange={(e) => update.mutate({ privacyOptIn: e.target.checked })}
                />
                <span>
                    Share anonymous usage statistics to help improve the app (off by default;
                    nothing is collected yet)
                </span>
            </label>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button
                    className="btn-secondary"
                    disabled={clear.isPending}
                    onClick={() =>
                        confirm(
                            'Remove all games, notes and tags? Settings are kept. This cannot be undone.',
                        ) && clear.mutate()
                    }
                >
                    Clear library
                </button>
                <button
                    className="btn-danger"
                    disabled={deleteAccount.isPending}
                    onClick={() =>
                        confirm(
                            'Permanently delete ALL your data from the server and start fresh? This cannot be undone.',
                        ) && deleteAccount.mutate()
                    }
                >
                    Delete all my data
                </button>
            </div>
        </div>
    );
}
