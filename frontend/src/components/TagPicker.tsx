import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { keys, useTags } from '../hooks/useApi';
import { api, errorMessage } from '../services/api';
import { toast } from '../store/useToastStore';
import type { Tag } from '../types';
import { TagChip } from './TagChip';

const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
];

/** Shows a game's tags; typing suggests existing tags or creates a new one on Enter. */
export function TagPicker({
    selected,
    onChange,
}: {
    selected: Tag[];
    onChange: (tagIds: string[]) => void;
}) {
    const [query, setQuery] = useState('');
    const listId = useId();
    const { data: tags = [] } = useTags();
    const qc = useQueryClient();
    const create = useMutation({
        mutationFn: (name: string) =>
            api.createTag({ name, color: COLORS[tags.length % COLORS.length] }),
        onSuccess: async (tag) => {
            await qc.invalidateQueries({ queryKey: keys.tags });
            onChange([...selected.map((t) => t.id), tag.id]);
            setQuery('');
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    const selectedIds = new Set(selected.map((t) => t.id));
    const suggestions = tags.filter(
        (t) => !selectedIds.has(t.id) && t.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    const submit = () => {
        const name = query.trim();
        if (!name) return;
        const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            if (!selectedIds.has(existing.id)) onChange([...selectedIds, existing.id]);
            setQuery('');
        } else {
            create.mutate(name);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {selected.length === 0 && <span className="muted text-sm">No tags yet.</span>}
                {selected.map((t) => (
                    <TagChip
                        key={t.id}
                        tag={t}
                        onRemove={() =>
                            onChange(selected.filter((x) => x.id !== t.id).map((x) => x.id))
                        }
                    />
                ))}
            </div>
            <input
                className="input"
                list={listId}
                value={query}
                maxLength={50}
                placeholder="Add a tag (e.g. Co-op, Story-Heavy) and press Enter"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                    }
                }}
                aria-label="Add tag"
            />
            <datalist id={listId}>
                {suggestions.map((t) => (
                    <option key={t.id} value={t.name} />
                ))}
            </datalist>
            {query === '' && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 8).map((t) => (
                        <button
                            key={t.id}
                            className="opacity-70 hover:opacity-100"
                            onClick={() => onChange([...selectedIds, t.id])}
                            aria-label={`Add tag ${t.name}`}
                        >
                            <TagChip tag={t} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
