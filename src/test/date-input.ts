import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const monthMap: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
};

function parseMonthHeading(value: string) {
  const normalized = value.toLowerCase().trim();
  const [monthName, yearText] = normalized.split(' de ');
  const month = monthMap[monthName];
  const year = Number(yearText);

  if (!month || Number.isNaN(year)) {
    throw new Error(`Não foi possível interpretar o mês exibido: ${value}`);
  }

  return { year, month };
}

export async function selectDateInDateInput(label: string, isoDate: string) {
  const [yearText, monthText] = isoDate.split('-');
  const targetYear = Number(yearText);
  const targetMonth = Number(monthText);

  await userEvent.click(screen.getByLabelText(label));

  for (;;) {
    const heading = screen.getByText(/.+ de \d{4}/i);
    const current = parseMonthHeading(heading.textContent ?? '');
    if (current.year === targetYear && current.month === targetMonth) {
      break;
    }

    const goBack = current.year > targetYear || (current.year === targetYear && current.month > targetMonth);
    await userEvent.click(screen.getByRole('button', { name: goBack ? 'Mês anterior' : 'Próximo mês' }));
  }

  const matchingButtons = screen.getAllByRole('button', { name: isoDate });
  const targetButton = matchingButtons.find((button) => !button.className.includes('opacity-50')) ?? matchingButtons[0];

  await userEvent.click(targetButton);
}

export async function selectMonthInDateInput(label: string, isoMonth: string) {
  const [yearText, monthText] = isoMonth.split('-');
  const targetYear = Number(yearText);
  const targetMonth = Number(monthText);
  const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  await userEvent.click(screen.getByLabelText(label));

  for (;;) {
    const yearDisplay = screen.getByText(/^\d{4}$/);
    const currentYear = Number(yearDisplay.textContent);

    if (currentYear === targetYear) {
      break;
    }

    await userEvent.click(screen.getByRole('button', { name: currentYear > targetYear ? 'Ano anterior' : 'Próximo ano' }));
  }

  await userEvent.click(screen.getByRole('button', { name: `${monthLabels[targetMonth - 1]} ${targetYear}` }));
}
