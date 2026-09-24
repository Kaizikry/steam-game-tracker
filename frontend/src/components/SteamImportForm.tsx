import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { invalidateLibrary, keys, useMe, useSettings } from '../hooks/useApi';
import { api, errorMessage } from '../services/api';
import { toast } from '../store/useToastStore';
import type { ImportResult } from '../types';

export function SteamImportForm({ onDone }: { onDone?: (r: ImportResult) => void }) {
    const { data: me } = useMe();
    const { data: settings } = useSettings();
    const [profile, setProfile] = useState('');
    const [includeFreeToPlay, setIncludeFreeToPlay] = useState<boolean | null>(null);
    const [autoCategorize, setAutoCategorize] = useState(true);
    const qc = useQueryClient();

    const includeF2P = includeFreeToPlay ?? settings?.includeFreeToPlay ?? true;
    const value = profile || me?.steamId || '';

    const mutation = useMutation({
        mutationFn: () =>
            api.importSteam({ profile: value, includeFreeToPlay: includeF2P, autoCategorize }),
        onSuccess: (r) => {
            toast.success(
                r.newGamesAdded > 0
                    ? `Imported ${r.totalGamesImported} games (${r.newGamesAdded} new)`
                    : `Library up to date: ${r.totalGamesImported} games, ${r.updatedGames} with new play time`,
            );
            qc.invalidateQueries({ queryKey: keys.importHistory });
            qc.invalidateQueries({ queryKey: keys.settings });
            invalidateLibrary(qc);
            onDone?.(r);
        },
    });

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (value.trim()) mutation.mutate();
            }}
        >
            <div className="space-y-1.5">
                <label htmlFor="steam-profile" className="text-sm font-medium">
                    Steam profile
                </label>
                <input
                    id="steam-profile"
                    className="input"
                    placeholder="https://steamcommunity.com/id/yourname, a custom URL name, or a 17-digit SteamID64"
                    value={value}
                    onChange={(e) => setProfile(e.target.value)}
                    autoComplete="off"
                    required
                />
                <p className="muted text-xs">
                    Your profile and <em>Game details</em> must be public (Steam → Edit Profile →
                    Privacy Settings).
                </p>
            </div>
            <fieldset className="space-y-2 text-sm">
                <legend className="mb-1 font-medium">Options</legend>
                <label className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-sky-500"
                        checked={includeF2P}
                        onChange={(e) => setIncludeFreeToPlay(e.target.checked)}
                    />
                    <span>Include free-to-play games you've played</span>
                </label>
                <label className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-sky-500"
                        checked={autoCategorize}
                        onChange={(e) => setAutoCategorize(e.target.checked)}
                    />
                    <span>
                        Auto-sort new games: unplayed → Not Started, played → In Progress
                        <span className="muted block text-xs">
                            Only affects newly added games. Existing statuses and notes are never
                            changed.
                        </span>
                    </span>
                </label>
                <p className="muted text-xs">
                    Steam's API doesn't list DLC or hidden games separately, so there's nothing to
                    filter for those.
                </p>
            </fieldset>
            {mutation.isError && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"
                >
                    {errorMessage(mutation.error)}
                </p>
            )}
            <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={mutation.isPending || !value.trim()}
            >
                {mutation.isPending
                    ? 'Importing from Steam…'
                    : me?.lastImport
                      ? 'Re-import library'
                      : 'Import library'}
            </button>
        </form>
    );
}
