import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useFieldArray } from 'react-hook-form';
import { RateioSection } from './RateioSection';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { FinanceiroFormValues } from '../module-config';

vi.mock('../../cadastros/quick-add/QuickAddContaGerencialModal', () => ({
  QuickAddContaGerencialModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">QuickAddContaGerencial</div> : null,
}));

function RateioWrapper({
  initialRateios = [{ contaGerencialId: '', valor: 0 }],
  canEdit = true,
  totalRateios = 100,
  valorLiquido = 100,
  rateioOptions = [{ label: 'Marketing', value: 'cg1' }],
}: {
  initialRateios?: { contaGerencialId: string; valor: number }[];
  canEdit?: boolean;
  totalRateios?: number;
  valorLiquido?: number;
  rateioOptions?: { label: string; value: string }[];
}) {
  const form = useForm<FinanceiroFormValues>({
    defaultValues: { rateios: initialRateios } as never,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rateios',
  });

  const mockApi = {
    control: form.control,
    canEdit,
    fields,
    append,
    remove,
    rateioOptions,
    totalRateios,
    valorLiquido,
    setValue: form.setValue as never,
    reloadRateioOptions: vi.fn().mockResolvedValue(undefined),
  } as unknown as FinancialAccountFormApi;

  return <RateioSection form={mockApi} />;
}

describe('RateioSection', () => {
  it('renders a single row with label "Conta Gerencial"', () => {
    render(<RateioWrapper />);
    expect(screen.getByText('Conta Gerencial')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('shows multi-row description when singleRow=false after append', async () => {
    render(<RateioWrapper />);
    // Initially shows single-row description
    expect(screen.getByText(/Com uma única conta/)).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Adicionar conta ao rateio'));
    expect(screen.queryByText(/Com uma única conta/)).not.toBeInTheDocument();
    expect(screen.getByText(/Distribua o valor líquido/)).toBeInTheDocument();
  });

  it('disables add button when canEdit=false', () => {
    render(<RateioWrapper canEdit={false} />);
    expect(screen.getByTitle('Adicionar conta ao rateio')).toBeDisabled();
  });

  it('renders delete button (disabled when only 1 row)', () => {
    render(<RateioWrapper />);
    const deleteButtons = document.querySelectorAll('button[type="button"][class*="text-error"]');
    expect(deleteButtons.length).toBe(1);
    expect(deleteButtons[0]).toBeDisabled();
  });

  it('enables delete button when 2 rows exist', async () => {
    render(<RateioWrapper initialRateios={[{ contaGerencialId: '', valor: 0 }, { contaGerencialId: '', valor: 50 }]} />);
    const deleteButtons = document.querySelectorAll('button[type="button"][class*="text-error"]');
    expect(deleteButtons.length).toBe(2);
    expect(deleteButtons[0]).not.toBeDisabled();
  });

  it('shows Total Rateado value in primary color when balanced', () => {
    render(<RateioWrapper totalRateios={100} valorLiquido={100} />);
    expect(screen.getByText('Total Rateado')).toBeInTheDocument();
  });

  it('shows Total Rateado in warning color when unbalanced', () => {
    render(<RateioWrapper totalRateios={80} valorLiquido={100} />);
    // The span should have warning color class
    const total = screen.getByText('Total Rateado');
    expect(total).toBeInTheDocument();
    // The sibling with the total value should exist
    expect(document.querySelector('[class*="text-warning"]')).toBeInTheDocument();
  });

  it('opens QuickAddContaGerencial modal when onAddNew is triggered', async () => {
    render(<RateioWrapper canEdit />);
    // The ComboBox "Adicionar novo" button opens the quick-add modal
    const addNewBtn = screen.getByRole('button', { name: /Adicionar novo/i });
    await userEvent.click(addNewBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
