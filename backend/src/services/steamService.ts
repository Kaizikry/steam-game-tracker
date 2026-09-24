import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { AppError } from '../utils/response';
import { createThrottle } from '../utils/throttle';

const STEAM_API = 'https://api.steampowered.com';
const STORE_API = 'https://store.steampowered.com';

export interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number; // minutes
    img_icon_url?: string;
    rtime_last_played?: number; // unix seconds, 0 if never
}

export interface SteamProfile {
    steamId: string;
    personaName?: string;
    profileUrl?: string;
    avatar?: string;
}

export interface StoreDetails {
    description?: string;
    releaseDate?: Date;
    steamRating?: number; // % positive reviews, 0-100
    isFreeToPlay?: boolean;
    isDLC?: boolean;
}

export interface SteamAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
    name?: string;
    description?: string;
}

export type ProfileInput = { kind: 'steamId'; value: string } | { kind: 'vanity'; value: string };

/**
 * Parses what a user might paste: a SteamID64, a /profiles/<id> URL,
 * an /id/<vanity> URL, or a bare vanity name.
 */
export function parseProfileInput(raw: string): ProfileInput {
    const input = raw.trim();
    if (!input) throw new AppError(400, 'INVALID_REQUEST', 'Steam ID or profile URL is required');

    const profilesMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (profilesMatch) return { kind: 'steamId', value: profilesMatch[1] };

    const idMatch = input.match(/steamcommunity\.com\/id\/([A-Za-z0-9_-]{2,32})/i);
    if (idMatch) return { kind: 'vanity', value: idMatch[1] };

    if (/^7656\d{13}$/.test(input)) return { kind: 'steamId', value: input };
    if (/^[A-Za-z0-9_-]{2,32}$/.test(input)) return { kind: 'vanity', value: input };

    throw new AppError(
        400,
        'INVALID_STEAM_ID',
        'That does not look like a Steam ID, profile URL or custom URL name',
    );
}

export const coverArtUrl = (appId: number) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

export class SteamService {
    private throttle = createThrottle(1000);

    constructor(
        private http: AxiosInstance = axios.create({ timeout: 20_000 }),
        private apiKey: string = config.STEAM_API_KEY,
    ) {}

    private requireKey() {
        if (!this.apiKey) {
            throw new AppError(
                503,
                'STEAM_NOT_CONFIGURED',
                'The server has no STEAM_API_KEY configured. Add one to backend/.env to enable Steam import.',
            );
        }
    }

    private async get<T>(url: string, params: Record<string, unknown>): Promise<T> {
        try {
            const res = await this.throttle(() => this.http.get<T>(url, { params }));
            return res.data;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 429)
                    throw new AppError(
                        429,
                        'STEAM_RATE_LIMITED',
                        'Steam is rate limiting requests. Try again in a minute.',
                    );
                if (status === 401 || status === 403)
                    throw new AppError(
                        502,
                        'STEAM_AUTH_FAILED',
                        'Steam rejected the API key or the profile is private.',
                    );
                throw new AppError(
                    502,
                    'STEAM_UNAVAILABLE',
                    'Could not reach the Steam API. Try again later.',
                );
            }
            throw err;
        }
    }

    async resolveSteamId(raw: string): Promise<string> {
        const parsed = parseProfileInput(raw);
        if (parsed.kind === 'steamId') return parsed.value;
        this.requireKey();
        const data = await this.get<{ response: { success: number; steamid?: string } }>(
            `${STEAM_API}/ISteamUser/ResolveVanityURL/v1/`,
            { key: this.apiKey, vanityurl: parsed.value },
        );
        if (data.response.success !== 1 || !data.response.steamid) {
            throw new AppError(
                404,
                'STEAM_PROFILE_NOT_FOUND',
                `No Steam profile found for "${parsed.value}"`,
            );
        }
        return data.response.steamid;
    }

    async getProfile(steamId: string): Promise<SteamProfile> {
        this.requireKey();
        const data = await this.get<{
            response: {
                players: {
                    steamid: string;
                    personaname?: string;
                    profileurl?: string;
                    avatarfull?: string;
                }[];
            };
        }>(`${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/`, {
            key: this.apiKey,
            steamids: steamId,
        });
        const player = data.response.players[0];
        if (!player) throw new AppError(404, 'STEAM_PROFILE_NOT_FOUND', 'Steam profile not found');
        return {
            steamId,
            personaName: player.personaname,
            profileUrl: player.profileurl,
            avatar: player.avatarfull,
        };
    }

    async getOwnedGames(
        steamId: string,
        includePlayedFreeGames: boolean,
    ): Promise<SteamOwnedGame[]> {
        this.requireKey();
        const data = await this.get<{
            response: { game_count?: number; games?: SteamOwnedGame[] };
        }>(`${STEAM_API}/IPlayerService/GetOwnedGames/v1/`, {
            key: this.apiKey,
            steamid: steamId,
            include_appinfo: true,
            include_played_free_games: includePlayedFreeGames,
            format: 'json',
        });
        if (data.response.games === undefined) {
            throw new AppError(
                403,
                'STEAM_PROFILE_PRIVATE',
                'Steam returned no games. Make sure the profile and its "Game details" are set to Public.',
            );
        }
        return data.response.games;
    }

    /**
     * Returns the library with an isFreeToPlay flag. Steam doesn't label free games, so when
     * they're included we fetch twice and treat games only present in the second list as free.
     */
    async getLibrary(steamId: string, includeFreeToPlay: boolean) {
        const paid = await this.getOwnedGames(steamId, false);
        if (!includeFreeToPlay) return paid.map((g) => ({ ...g, isFreeToPlay: false }));
        const all = await this.getOwnedGames(steamId, true);
        const paidIds = new Set(paid.map((g) => g.appid));
        return all.map((g) => ({ ...g, isFreeToPlay: !paidIds.has(g.appid) }));
    }

    /** Store metadata + review score for one app. Public endpoints, no key needed. */
    async getStoreDetails(appId: number): Promise<StoreDetails> {
        const details: StoreDetails = {};
        try {
            const data = await this.get<
                Record<
                    string,
                    {
                        success: boolean;
                        data?: {
                            type?: string;
                            short_description?: string;
                            is_free?: boolean;
                            release_date?: { date?: string };
                        };
                    }
                >
            >(`${STORE_API}/api/appdetails`, { appids: appId, l: 'english', cc: 'us' });
            const app = data[String(appId)];
            if (app?.success && app.data) {
                details.description = app.data.short_description || undefined;
                details.isFreeToPlay = app.data.is_free;
                details.isDLC = app.data.type === 'dlc';
                const parsed = app.data.release_date?.date
                    ? new Date(app.data.release_date.date)
                    : null;
                if (parsed && !Number.isNaN(parsed.getTime())) details.releaseDate = parsed;
            }
        } catch {
            // Store metadata is best-effort.
        }
        try {
            const reviews = await this.get<{
                query_summary?: { total_positive: number; total_reviews: number };
            }>(`${STORE_API}/appreviews/${appId}`, {
                json: 1,
                language: 'all',
                purchase_type: 'all',
                num_per_page: 0,
            });
            const summary = reviews.query_summary;
            if (summary && summary.total_reviews > 0) {
                details.steamRating =
                    Math.round((summary.total_positive / summary.total_reviews) * 1000) / 10;
            }
        } catch {
            // Reviews are best-effort.
        }
        return details;
    }

    /** Returns null when the game has no achievements or they're not visible. */
    async getAchievements(steamId: string, appId: number): Promise<SteamAchievement[] | null> {
        if (!this.apiKey) return null;
        try {
            const data = await this.get<{
                playerstats?: { success: boolean; achievements?: SteamAchievement[] };
            }>(`${STEAM_API}/ISteamUserStats/GetPlayerAchievements/v1/`, {
                key: this.apiKey,
                steamid: steamId,
                appid: appId,
                l: 'english',
            });
            return data.playerstats?.success && data.playerstats.achievements
                ? data.playerstats.achievements
                : null;
        } catch {
            return null; // Steam answers 400 for games without stats.
        }
    }
}

export const steamService = new SteamService();
