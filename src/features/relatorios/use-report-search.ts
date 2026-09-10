import { useEffect, useState } from 'react';

export function useReportSearch(value: string, delay = 300) {
  const [search, setSearch] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return search;
}
