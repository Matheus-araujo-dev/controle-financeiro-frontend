import { useSearchParams } from 'react-router-dom';

/** URL is the state source so browser back/forward restores report filters. */
export function useReportUrlState<T extends string | string[]>(key: string, fallback: T, validate?: (value: T) => boolean): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  let value = fallback;
  if (raw !== null) {
    if (Array.isArray(fallback)) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) value = parsed as T;
      } catch { /* Invalid URL values use the existing default. */ }
    } else value = raw as T;
  }
  if (validate && !validate(value)) value = fallback;
  return [value, next => setParams(previous => {
    const updated = new URLSearchParams(previous);
    if (JSON.stringify(next) === JSON.stringify(fallback)) updated.delete(key);
    else updated.set(key, Array.isArray(next) ? JSON.stringify(next) : next);
    return updated;
  }, { replace: key !== 'activeReport' })];
}
