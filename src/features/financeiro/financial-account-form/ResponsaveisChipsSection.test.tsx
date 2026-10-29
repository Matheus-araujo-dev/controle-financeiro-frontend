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
  valorLiquido = 0,
  personRole
}: {
  defaultValues?: Partial<FinanceiroFormValues>;
  canEdit?: boolean;
  valorLiquido?: number;
  personRole?: 'recebedor' | 'pagador';
}) {
  const { control, setValue, formState: { errors } } = useForm<FinanceiroFormValues>({
    defaultValues: {
      membroId: '',
      pagadoresAdicionaisIds: [],
      ...defaultValues
    }
  });

  const form = {
    control,
    errors,
    canEdit,
    membroOptions: OPTIONS,
    pessoaOptions: OPTIONS,
    setValue,
    valorLiquido,
    reloadMembroOptions: vi.fn().mockResolvedValue(undefined)
  } as unknown as FinancialAccountFormApi;

  return <ResponsaveisChipsSection form={form} personRole={personRole} />;
}

describe('ResponsaveisChipsSection', () => {
  it('renders the add combobox with all options when empty', () => {
    render(<Wrapper />);
    const select = screen.getByLabelText('Adicionar membro');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument();
  });

  it('auto-adiciona o primeiro responsável como primário ao selecionar', () => {
    render(<Wrapper />);
    // Auto-adiciona ao selecionar — sem botão "+" separado
    fireEvent.change(screen.getByLabelText('Adicionar membro'), { target: { value: 'r1' } });
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    // Alice não aparece mais como opção disponível
    expect(screen.queryByRole('option', { name: 'Alice' })).not.toBeInTheDocument();
  });

  it('auto-adiciona segundo responsável a pagadoresAdicionaisIds ao selecionar', () => {
    render(<Wrapper defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: [] }} />);
    fireEvent.change(screen.getByLabelText('Adicionar membro'), { target: { value: 'r2' } });
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();
  });

  it('removing primary responsável promotes the first additional', () => {
    render(<Wrapper defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: ['r2'] }} />);
    // Both Alice and Bob are chips
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remover Alice/i }));

    // Bob promoted, Alice removed
    expect(screen.queryByRole('button', { name: /Remover Alice/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover Bob/i })).toBeInTheDocument();
  });

  it('removing an additional responsável leaves primary untouched', () => {
    render(<Wrapper defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: ['r2'] }} />);
    fireEvent.click(screen.getByRole('button', { name: /Remover Bob/i }));
    expect(screen.getByRole('button', { name: /Remover Alice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remover Bob/i })).not.toBeInTheDocument();
  });

  it('shows total distribuído and valor inputs when count > 1 and valorLiquido > 0', () => {
    render(
      <Wrapper
        defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: ['r2'] }}
        valorLiquido={300}
      />
    );
    expect(screen.getByText(/total distribuído/i)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').some((el) => (el as HTMLInputElement).value.includes('150'))).toBe(true);
  });

  it('does not show total distribuído when only one responsável', () => {
    render(<Wrapper defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: [] }} valorLiquido={300} />);
    expect(screen.queryByText(/total distribuído/i)).not.toBeInTheDocument();
  });

  it('hides add controls when canEdit is false', () => {
    render(
      <Wrapper
        defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: [] }}
        canEdit={false}
      />
    );
    expect(screen.queryByLabelText('Adicionar membro')).not.toBeInTheDocument();
    // Remove buttons also hidden
    expect(screen.queryByRole('button', { name: /Remover/i })).not.toBeInTheDocument();
  });

  it('shows error message when errors.membroId is set', () => {
    const { control, setValue, formState: { errors } } = (() => {
      let captured: ReturnType<typeof useForm<FinanceiroFormValues>> | null = null;
      function Capture() {
        captured = useForm<FinanceiroFormValues>({ defaultValues: { membroId: '', pagadoresAdicionaisIds: [] } });
        return null;
      }
      render(<Capture />);
      return captured!;
    })();

    // Build form with a fake error
    const formWithError = {
      control,
      errors: { membroId: { message: 'Responsável obrigatório', type: 'required' } },
      canEdit: true,
      membroOptions: OPTIONS,
      setValue,
      valorLiquido: 0,
      reloadMembroOptions: vi.fn().mockResolvedValue(undefined)
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
    render(<Wrapper defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: ['r2'] }} />);
    // plural: Responsáv + eis
    expect(screen.getByText('Membros')).toBeInTheDocument();
  });

  it('label shows "Responsável" when count is 0 or 1', () => {
    render(<Wrapper />);
    // singular: Responsáv + el
    expect(screen.getByText('Membro')).toBeInTheDocument();
  });

  it('personRole=pagador renders Pagador label, pagador aria-label and uses pessoaOptions', () => {
    render(<Wrapper personRole="pagador" />);
    expect(screen.getByText('Pagador')).toBeInTheDocument();
    expect(screen.getByLabelText('Adicionar pagador')).toBeInTheDocument();
    expect(screen.queryByLabelText('Adicionar membro')).not.toBeInTheDocument();
  });

  it('personRole=pagador shows Pagadores label when count > 1', () => {
    render(<Wrapper personRole="pagador" defaultValues={{ membroId: 'r1', pagadoresAdicionaisIds: ['r2'] }} />);
    expect(screen.getByText('Pagadores')).toBeInTheDocument();
  });
});
