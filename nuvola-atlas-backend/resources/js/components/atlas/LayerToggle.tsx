import { LAYER_META } from '../../mock/zones';

interface LayerToggleProps {
    activeLayers: Record<string, boolean>;
    onToggle: (layers: Record<string, boolean>) => void;
}

export function LayerToggle({ activeLayers, onToggle }: LayerToggleProps) {
    const toggle = (key: string) => {
        onToggle({ ...activeLayers, [key]: !activeLayers[key] });
    };

    return (
        <div className="flex gap-2 mb-3 flex-wrap">
            {LAYER_META.map((l) => {
                const on = activeLayers[l.key];
                return (
                    <button
                        key={l.key}
                        onClick={() => toggle(l.key)}
                        className={`
                            border-none cursor-pointer px-4 py-2 rounded-pill
                            text-[12px] font-medium tracking-[-0.01em]
                            transition-all duration-[450ms] flex items-center gap-2
                            ${on
                                ? 'bg-ink text-surface shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
                                : 'bg-black/5 text-black/60 shadow-none hover:bg-black/8'
                            }
                        `}
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full transition-opacity"
                            style={{
                                backgroundColor: l.color,
                                opacity: on ? 1 : 0.5,
                            }}
                        />
                        {l.label}
                    </button>
                );
            })}
        </div>
    );
}
