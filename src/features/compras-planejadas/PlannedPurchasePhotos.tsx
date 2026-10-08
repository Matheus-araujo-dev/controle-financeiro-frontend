import { useRef, useState } from 'react';

type Props = { files: File[]; onChange: (files: File[]) => void; disabled?: boolean };
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function PlannedPurchasePhotos({ files, onChange, disabled }: Props) {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  return <section aria-label="Anexar fotos" className="space-y-3 rounded-2xl bg-surface-container-low p-5">
    <h3 className="font-semibold">Fotos do produto</h3>
    <p className="text-sm text-on-surface-variant">Opcional. JPEG, PNG ou WEBP, até 10 MB por foto. As fotos serão enviadas ao confirmar o planejamento.</p>
    <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}
      className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">Selecionar fotos</button>
    <input ref={inputRef} aria-label="Fotos do produto" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled}
      className="sr-only" onChange={event => {
        const selected = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (selected.some(file => !allowedTypes.has(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
          setError('Selecione fotos JPEG, PNG ou WEBP não vazias, de até 10 MB cada.');
          return;
        }
        setError(undefined);
        onChange([...files, ...selected]);
      }} />
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {files.length > 0 && <ul className="space-y-2">
      {files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-all text-sm">{file.name}</span>
        <button type="button" disabled={disabled} aria-label={`Remover foto ${file.name}`} className="shrink-0 text-sm text-error underline"
          onClick={() => onChange(files.filter((_, position) => position !== index))}>Remover</button>
      </li>)}
    </ul>}
  </section>;
}
