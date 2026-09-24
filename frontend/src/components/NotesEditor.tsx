import { useRef, useState } from 'react';
import { RichText } from '../utils/richText';
import { formatRelative } from '../utils/format';

export const NOTES_LIMIT = 500;

interface Props {
    initial: string;
    updatedAt: string | null;
    saving: boolean;
    onSave: (notes: string) => void;
}

/** Plain textarea with **bold**, *italic* and bullet shortcuts, plus a rendered preview. */
export function NotesEditor({ initial, updatedAt, saving, onSave }: Props) {
    const [value, setValue] = useState(initial);
    const [preview, setPreview] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);
    const dirty = value !== initial;

    const wrap = (marker: string) => {
        const el = ref.current;
        if (!el) return;
        const { selectionStart: a, selectionEnd: b } = el;
        const next = value.slice(0, a) + marker + value.slice(a, b) + marker + value.slice(b);
        if (next.length > NOTES_LIMIT) return;
        setValue(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(a + marker.length, b + marker.length);
        });
    };

    const bullet = () => {
        const el = ref.current;
        if (!el) return;
        const lineStart = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
        const next = value.slice(0, lineStart) + '- ' + value.slice(lineStart);
        if (next.length <= NOTES_LIMIT) setValue(next);
        el.focus();
    };

    const tool = 'rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-steam-700';

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className={`${tool} font-bold`}
                    onClick={() => wrap('**')}
                    aria-label="Bold"
                    disabled={preview}
                >
                    B
                </button>
                <button
                    type="button"
                    className={`${tool} italic`}
                    onClick={() => wrap('*')}
                    aria-label="Italic"
                    disabled={preview}
                >
                    I
                </button>
                <button
                    type="button"
                    className={tool}
                    onClick={bullet}
                    aria-label="Bullet list"
                    disabled={preview}
                >
                    • List
                </button>
                <button
                    type="button"
                    className={`${tool} ml-auto`}
                    onClick={() => setPreview((p) => !p)}
                    aria-pressed={preview}
                >
                    {preview ? 'Edit' : 'Preview'}
                </button>
            </div>
            {preview ? (
                <div className="min-h-28 rounded-lg border border-slate-300 p-3 dark:border-slate-600">
                    {value.trim() ? (
                        <RichText text={value} />
                    ) : (
                        <p className="muted text-sm">Nothing yet.</p>
                    )}
                </div>
            ) : (
                <textarea
                    ref={ref}
                    className="input min-h-28 resize-y"
                    maxLength={NOTES_LIMIT}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && dirty) onSave(value);
                        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                            e.preventDefault();
                            wrap('**');
                        }
                        if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                            e.preventDefault();
                            wrap('*');
                        }
                    }}
                    placeholder="Where did you leave off? e.g. Stuck at **Malenia**, need to level Vigor"
                    aria-label="Notes"
                />
            )}
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="muted">
                    {value.length}/{NOTES_LIMIT} ·{' '}
                    {updatedAt ? `Updated ${formatRelative(updatedAt)}` : 'No notes yet'}
                </span>
                <button
                    className="btn-primary"
                    disabled={!dirty || saving}
                    onClick={() => onSave(value)}
                >
                    {saving ? 'Saving…' : 'Save notes'}
                </button>
            </div>
        </div>
    );
}
