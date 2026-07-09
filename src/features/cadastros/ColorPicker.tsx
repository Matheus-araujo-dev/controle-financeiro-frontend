const PRESET_COLORS = [
  { value: '#2bf58e', label: 'Esmeralda' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#eab308', label: 'Âmbar' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#78716c', label: 'Pedra' },
  { value: '#6b7280', label: 'Cinza' },
];

type ColorPickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => {
        const selected = value === color.value;
        return (
          <button
            key={color.value}
            type="button"
            title={color.label}
            onClick={() => onChange(color.value)}
            className={[
              'h-8 w-8 rounded-full border-2 transition-transform',
              selected ? 'scale-110 border-white' : 'border-transparent hover:scale-105',
            ].join(' ')}
            style={{ backgroundColor: color.value }}
          />
        );
      })}
    </div>
  );
}
