import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { ComboBox } from '../../../components/forms/ComboBox';
import { QuickAddPessoaModal } from '../../cadastros/quick-add/QuickAddPessoaModal';
import { fieldLabelClass, errorTextClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { SelectOption } from '../module-config';

type ResponsaveisChipsSectionProps = {
  form: FinancialAccountFormApi;
  personRole?: 'recebedor' | 'pagador';
};

export function ResponsaveisChipsSection({ form, personRole = 'recebedor' }: ResponsaveisChipsSectionProps) {
  const { control, errors, canEdit, responsavelOptions, pessoaOptions, setValue, reloadResponsavelOptions } = form;
  const isPagador = personRole === 'pagador';
  const chipOptions = isPagador ? pessoaOptions : responsavelOptions;

  const [addingId, setAddingId] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const responsavelId = useWatch({ control, name: 'responsavelId' }) ?? '';
  const responsaveisAdicionaisIds = useWatch({ control, name: 'responsaveisAdicionaisIds' }) ?? [];
  const responsaveisValores = useWatch({ control, name: 'responsaveisValores' }) ?? [];

  const allSelected: Array<{ id: string; label: string }> = buildChipList(
    responsavelId,
    responsaveisAdicionaisIds,
    responsavelOptions
  );

  const count = allSelected.length;
  const valorLiquido = form.valorLiquido;

  const available = chipOptions.filter(
    (o) => o.value !== responsavelId && !responsaveisAdicionaisIds.includes(o.value)
  );

  function getValorForIndex(i: number): number {
    if (responsaveisValores.length === count) return responsaveisValores[i];
    return count > 0 ? Math.round((valorLiquido / count) * 100) / 100 : 0;
  }

  function handleValorChange(changedIndex: number, newValor: number) {
    const others = allSelected.map((_, i) => i).filter((i) => i !== changedIndex);
    const remainder = Math.max(0, valorLiquido - newValor);
    const perOther = others.length > 0 ? Math.round((remainder / others.length) * 100) / 100 : 0;
    const novosValores = allSelected.map((_, i) => (i === changedIndex ? newValor : perOther));
    setValue('responsaveisValores', novosValores, { shouldValidate: false });
  }

  function handleAdd() {
    if (!addingId) return;
    if (!responsavelId) {
      setValue('responsavelId', addingId, { shouldValidate: true });
    } else {
      setValue('responsaveisAdicionaisIds', [...responsaveisAdicionaisIds, addingId], { shouldValidate: true });
    }
    setValue('responsaveisValores', [], { shouldValidate: false });
    setAddingId('');
  }

  function handleRemove(id: string) {
    if (id === responsavelId) {
      const [next, ...rest] = responsaveisAdicionaisIds;
      setValue('responsavelId', next ?? '', { shouldValidate: true });
      setValue('responsaveisAdicionaisIds', rest ?? [], { shouldValidate: true });
    } else {
      setValue('responsaveisAdicionaisIds', responsaveisAdicionaisIds.filter((x: string) => x !== id), { shouldValidate: true });
    }
    setValue('responsaveisValores', [], { shouldValidate: false });
  }

  function handleQuickAddSuccess(newId: string) {
    void reloadResponsavelOptions().then(() => {
      if (!responsavelId) {
        setValue('responsavelId', newId, { shouldValidate: true });
      } else {
        setValue('responsaveisAdicionaisIds', [...responsaveisAdicionaisIds, newId], { shouldValidate: true });
      }
      setValue('responsaveisValores', [], { shouldValidate: false });
    });
  }

  const totalValores = count > 0 ? allSelected.reduce((acc, _, i) => acc + getValorForIndex(i), 0) : 0;
  const totalFecha = count > 1 && Math.abs(totalValores - valorLiquido) < 0.02;

  return (
    <div className="space-y-2">
      <label className={fieldLabelClass}>{isPagador ? `Pagador${count > 1 ? 'es' : ''}` : `Responsáv${count > 1 ? 'eis' : 'el'}`}</label>

      {/* Hidden controllers to wire into RHF */}
      <Controller control={control} name="responsavelId" render={() => <input type="hidden" />} />
      <Controller control={control} name="responsaveisAdicionaisIds" render={() => <input type="hidden" />} />
      <Controller control={control} name="responsaveisValores" render={() => <input type="hidden" />} />

      {/* Campo para adicionar novo responsável */}
      {canEdit && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ComboBox
              value={addingId}
              onChange={setAddingId}
              aria-label={isPagador ? 'Adicionar pagador' : 'Adicionar responsável'}
              onAddNew={() => setQuickAddOpen(true)}
              addNewLabel="Nova pessoa"
            >
              <option value="">{isPagador ? 'Adicionar pagador...' : 'Adicionar responsável...'}</option>
              {available.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </ComboBox>
          </div>
          <button
            type="button"
            aria-label="add"
            disabled={!addingId}
            onClick={handleAdd}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-surface-container text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg leading-none">add</span>
          </button>
        </div>
      )}

      {errors.responsavelId ? (
        <span className={errorTextClass}>{errors.responsavelId.message}</span>
      ) : null}

      {/* Chips + valores por responsável */}
      {allSelected.length > 0 && (
        <div className="space-y-1.5">
          {allSelected.map((chip, i) => (
            <div
              key={chip.id}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-surface-container px-3 py-2"
            >
              <span className="flex-1 truncate text-xs font-medium text-on-surface">{chip.label}</span>

              {count > 1 && (
                <ValorInput
                  value={getValorForIndex(i)}
                  onChange={(v) => handleValorChange(i, v)}
                  disabled={!canEdit}
                />
              )}

              {canEdit && (
                <button
                  type="button"
                  aria-label={`Remover ${chip.label}`}
                  onClick={() => handleRemove(chip.id)}
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary/70 transition-colors hover:bg-primary/40 hover:text-primary leading-none"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}

          {count > 1 && (
            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="text-on-surface-variant/60">Total distribuído</span>
              <span className={totalFecha ? 'font-medium text-primary' : 'font-medium text-red-400'}>
                {totalValores.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {totalFecha
                  ? ' ✓'
                  : ` (faltam ${(valorLiquido - totalValores).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
              </span>
            </div>
          )}
        </div>
      )}


      <QuickAddPessoaModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
        defaultRole="responsavel"
      />
    </div>
  );
}

function ValorInput({
  value,
  onChange,
  disabled
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused
    ? raw
    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      disabled={disabled}
      onFocus={() => {
        setRaw(value.toFixed(2).replace('.', ','));
        setFocused(true);
      }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
      }}
      className="w-28 rounded-xl bg-surface-container ring-1 ring-white/5 px-2 py-1 text-right text-xs font-medium text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function buildChipList(
  primary: string,
  additional: string[],
  options: SelectOption[]
): Array<{ id: string; label: string }> {
  const byId = new Map(options.map((o) => [o.value, o.label]));
  const result: Array<{ id: string; label: string }> = [];
  if (primary) result.push({ id: primary, label: byId.get(primary) ?? primary });
  additional.forEach((id) => {
    if (id) result.push({ id, label: byId.get(id) ?? id });
  });
  return result;
}
