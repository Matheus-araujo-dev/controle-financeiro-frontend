import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { ComboBox } from '../../../components/forms/ComboBox';
import { QuickAddPessoaModal } from '../../cadastros/quick-add/QuickAddPessoaModal';
import { fieldLabelClass, errorTextClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { SelectOption } from '../module-config';

type ResponsaveisChipsSectionProps = {
  form: FinancialAccountFormApi;
};

export function ResponsaveisChipsSection({ form }: ResponsaveisChipsSectionProps) {
  const { control, errors, canEdit, responsavelOptions, setValue, reloadResponsavelOptions } = form;

  const [addingId, setAddingId] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const responsavelId = useWatch({ control, name: 'responsavelId' }) ?? '';
  const responsaveisAdicionaisIds = useWatch({ control, name: 'responsaveisAdicionaisIds' }) ?? [];

  const allSelected: Array<{ id: string; label: string }> = buildChipList(
    responsavelId,
    responsaveisAdicionaisIds,
    responsavelOptions
  );

  const available = responsavelOptions.filter(
    (o) => o.value !== responsavelId && !responsaveisAdicionaisIds.includes(o.value)
  );

  function handleAdd() {
    if (!addingId) return;
    if (!responsavelId) {
      setValue('responsavelId', addingId, { shouldValidate: true });
    } else {
      setValue('responsaveisAdicionaisIds', [...responsaveisAdicionaisIds, addingId], { shouldValidate: true });
    }
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
  }

  function handleQuickAddSuccess(newId: string) {
    void reloadResponsavelOptions().then(() => {
      if (!responsavelId) {
        setValue('responsavelId', newId, { shouldValidate: true });
      } else {
        setValue('responsaveisAdicionaisIds', [...responsaveisAdicionaisIds, newId], { shouldValidate: true });
      }
    });
  }

  const valorLiquido = form.valorLiquido;
  const count = allSelected.length;
  const valorPorResponsavel = count > 1 ? valorLiquido / count : null;

  return (
    <div className="space-y-2">
      <label className={fieldLabelClass}>Responsáv{count > 1 ? 'eis' : 'el'}</label>

      {/* Hidden controller to wire responsavelId into RHF */}
      <Controller
        control={control}
        name="responsavelId"
        render={() => <input type="hidden" />}
      />
      <Controller
        control={control}
        name="responsaveisAdicionaisIds"
        render={() => <input type="hidden" />}
      />

      {/* Chips dos responsáveis selecionados */}
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-surface-container px-3 py-2.5">
          {allSelected.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 pl-2.5 pr-1.5 py-0.5 text-xs font-semibold text-primary"
            >
              {chip.label}
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Remover ${chip.label}`}
                  onClick={() => handleRemove(chip.id)}
                  className="grid h-4 w-4 place-items-center rounded-full text-primary/60 transition-colors hover:bg-primary/20 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[13px] leading-none">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Divisão igualitária */}
      {valorPorResponsavel !== null && (
        <p className="ml-1 text-[11px] text-on-surface-variant/70">
          Valor dividido igualmente: <strong className="text-on-surface">
            {valorPorResponsavel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong> por responsável
        </p>
      )}

      {/* Campo para adicionar novo responsável */}
      {canEdit && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ComboBox
              value={addingId}
              onChange={setAddingId}
              aria-label="Adicionar responsável"
              onAddNew={() => setQuickAddOpen(true)}
              addNewLabel="Nova pessoa"
            >
              <option value="">Adicionar responsável...</option>
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

      <QuickAddPessoaModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
        defaultRole="responsavel"
      />
    </div>
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
