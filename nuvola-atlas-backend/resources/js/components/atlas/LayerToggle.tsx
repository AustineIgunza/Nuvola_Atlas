import { LAYER_META } from '../../mock/zones';
import { useUIStore } from '../../stores/ui';

export function LayerToggle() {
    const activeLayers = useUIStore((s) => s.activeLayers);
    const toggleLayer = useUIStore((s) => s.toggleLayer);

    // Map LAYER_META keys to store keys
    const keyMap: Record<string, 'roads' | 'energy' | 'density'> = {
        roadProgress: 'roads',
        smartGrid: 'energy',
        density: 'density',
    };

    return (
        <div className="flex gap-2 mb-3 flex-wrap">
            {LAYER_META.map((l) => {
                const storeKey = keyMap[l.key] ?? l.key as 'roads' | 'energy' | 'density';
                const on = activeLayers[storeKey];
                return (
                    <button
                        key={l.key}
                        onClick={() => toggleLayer(storeKey)}
                        className={`
                            border-none cursor-pointer px-4 py-2 rounded-pill
                            text-[12px] font-medium tracking-[-0.01em]
                            transition-all duration-[450ms] flex items-center gap-2
                            ${on
                                ? 'bg-accent text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
                                : 'bg-ink/5 text-ink/60 shadow-none hover:bg-ink/8'
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
