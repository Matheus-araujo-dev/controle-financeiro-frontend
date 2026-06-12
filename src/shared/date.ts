export function formatDateBR(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('pt-BR');
}

export function formatMonthYearBR(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const isoMonthMatch = /^(\d{4})-(\d{2})$/.exec(value);

  if (isoMonthMatch) {
    const [, year, month] = isoMonthMatch;
    return `${month}/${year}`;
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (isoDateMatch) {
    const [, year, month] = isoDateMatch;
    return `${month}/${year}`;
  }

  return value;
}

export function toMonthInputValue(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const isoMonthMatch = /^(\d{4})-(\d{2})$/.exec(value);

  if (isoMonthMatch) {
    return value;
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (isoDateMatch) {
    const [, year, month] = isoDateMatch;
    return `${year}-${month}`;
  }

  return '';
}
