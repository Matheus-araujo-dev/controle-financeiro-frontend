import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { ResponsaveisChipsSection } from './ResponsaveisChipsSection';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { FinanceiroFormValues } from '../module-config';

vi.mock('../../../components/forms/ComboBox', () => ({
  ComboBox: ({
    value,
    onChange,
    options,
    placeholder,
    onAddNew,
    addNewLabel,
    'aria-label': ariaLabel,
    children
  }: {
    value: string;
    onChange: (value: string) => void;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    onAddNew?: () => void;
    addNewLabel?: string;
    'aria-label': string;
    children?: React.ReactNode;
  }) => (
    <div>
      <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>
        {children ?? (
          <>
            <option value="">{placeholder ?? 'Selecionar'}</option>
            {(options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </>
        )}
      </select>
      {onAddNew && <button type="button" onClick={onAddNew}>{addNewLabel}</button>}
    </div>
  )
}));

vi.mock('../../cadastros/quick-add/QuickAddPessoaModal', () => ({
  QuickAddPessoaModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Nova pessoa">
        <button type="button" onClick={() => onSuccess('new-id')}>Salvar</button>
        <button type="button" onClick={onClose}>Fechar</button>
      </div>
    ) : null
}));

const OPTIONS = [
  { value: 'r1', label: 'Alice' },
  { value: 'r2', label: 'Bob' },
  { value: 'r3', label: 'Carlos' }
];

function Wrapper({
  defaultValues,
  canEdit = true,
  valorLiquido = 0
}: {
  defaultValues?: Partial<FinanceiroFormValues>;
  canEdit?: boolean;
  valorLiquido?: number;
}) {
  const { control, setValue, formState: { errors } } = useForm<FinanceiroFormValues>({
    defaultValues: {
      responsavelId: '',
      responsaveisAdicionaisIds: [],
      ...defaultValues
    }
  });

  const form = {
    control,
    errors,
    canEdit,
    responsavelOptions: OPTIONS,
    setValue,
    valorLiquido,
    reloadResponsavelOptions: vi.fn().mockResolvedValue(undefined)
  } as unknown as FinancialAccountFormApi;

  return <ResponsaveisChipsSection form={form} />;
}

describe('ResponsaveisChipsSection', () => {
  it('renders the add combobox with all options when empty', () => {
    render(<Wrapper />);
    const select = screen.getByLabelText('Adicionar responsável');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument();
  });

  it('adds first responsável as primary (responsavelId)', () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByLabelText('Adicionar responsável'), { target: { value: 'r1' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    // Chip for Alice appears
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    // Alice is no longer in the available options
    expect(screen.queryByRole('option', { name: 'Alice' })).not.toBeInTheDocument();
  });

  it('adds second responsável to responsaveisAdicionaisIds', () => {
    render(<Wrapper defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: [] }} />);
    fireEvent.change(screen.getByLabelText('Adicionar responsável'), { target: { value: 'r2' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();
  });

  it('removing primary responsável promotes the first additional', () => {
    render(<Wrapper defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: ['r2'] }} />);
    // Both Alice and Bob are chips
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remover Alice/i }));

    // Bob promoted, Alice removed
    expect(screen.queryByRole('button', { name: /Remover Alice/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();
  });

  it('removing an additional responsável leaves primary untouched', () => {
    render(<Wrapper defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: ['r2'] }} />);
    fireEvent.click(screen.getByRole('button', { name: /Remover Bob/i }));
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remover Bob/i })).not.toBeInTheDocument();
  });

  it('shows divisão igualitária when count > 1 and valorLiquido > 0', () => {
    render(
      <Wrapper
        defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: ['r2'] }}
        valorLiquido={300}
      />
    );
    expect(screen.getByText(/por responsável/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150/)).toBeInTheDocument();
  });

  it('does not show divisão igualitária when only one responsável', () => {
    render(<Wrapper defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: [] }} valorLiquido={300} />);
    expect(screen.queryByText(/por responsável/i)).not.toBeInTheDocument();
  });

  it('hides add controls when canEdit is false', () => {
    render(
      <Wrapper
        defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: [] }}
        canEdit={false}
      />
    );
    expect(screen.queryByLabelText('Adicionar responsável')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
    // Remove buttons also hidden
    expect(screen.queryByRole('button', { name: /Remover/i })).not.toBeInTheDocument();
  });

  it('shows error message when errors.responsavelId is set', () => {
    const { control, setValue, formState: { errors } } = (() => {
      let captured: ReturnType<typeof useForm<FinanceiroFormValues>> | null = null;
      function Capture() {
        captured = useForm<FinanceiroFormValues>({ defaultValues: { responsavelId: '', responsaveisAdicionaisIds: [] } });
        return null;
      }
      render(<Capture />);
      return captured!;
    })();

    // Build form with a fake error
    const formWithError = {
      control,
      errors: { responsavelId: { message: 'Responsável obrigatório', type: 'required' } },
      canEdit: true,
      responsavelOptions: OPTIONS,
      setValue,
      valorLiquido: 0,
      reloadResponsavelOptions: vi.fn().mockResolvedValue(undefined)
    } as unknown as FinancialAccountFormApi;

    render(<ResponsaveisChipsSection form={formWithError} />);
    expect(screen.getByText('Responsável obrigatório')).toBeInTheDocument();
  });

  it('opens QuickAdd modal when "Nova pessoa" button clicked and closes it', async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: /nova pessoa/i }));
    expect(screen.getByRole('dialog', { name: /nova pessoa/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /nova pessoa/i })).not.toBeInTheDocument()
    );
  });

  it('label shows "Responsáveis" when count > 1', () => {
    render(<Wrapper defaultValues={{ responsavelId: 'r1', responsaveisAdicionaisIds: ['r2'] }} />);
    // plural: Responsáv + eis
    expect(screen.getByText('Responsáveis')).toBeInTheDocument();
  });

  it('label shows "Responsável" when count is 0 or 1', () => {
    render(<Wrapper />);
    // singular: Responsáv + el
    expect(screen.getByText('Responsável')).toBeInTheDocument();
  });
});
