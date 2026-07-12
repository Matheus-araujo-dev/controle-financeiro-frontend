import { createPortal } from 'react-dom';
import {
  Children,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

export type ComboBoxOption = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
  /** Text shown in the input after selection; defaults to getTextFromNode(label). */
  displayText?: string;
};

type LegacyOptionProps = {
  value?: string | number | null;
  children?: ReactNode;
  disabled?: boolean;
};

export type ComboBoxProps = {
  'aria-label'?: string;
  id?: string;
  name?: string;
  value?: string | null;
  options?: ComboBoxOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  children?: ReactNode;
  className?: string;
  /** Reduz a altura para h-11 (contexto de filtros) em vez de h-[54px] (formulários). */
  compact?: boolean;
};

function getTextFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromNode).join('');
  }

  if (isValidElement(node)) {
    return getTextFromNode((node as ReactElement<{ children?: ReactNode }>).props.children);
  }

  return '';
}

function readLegacyOptions(children: ReactNode) {
  let placeholder: string | undefined;
  const options: ComboBoxOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const option = child as ReactElement<LegacyOptionProps>;
    const value = option.props.value == null ? '' : String(option.props.value);
    const label = option.props.children;

    if (!value) {
      placeholder = getTextFromNode(label);
      return;
    }

    options.push({
      value,
      label,
      disabled: option.props.disabled
    });
  });

  return { options, placeholder };
}

function findNextEnabled(options: ComboBoxOption[], from: number, step: 1 | -1): number {
  const len = options.length;
  for (let i = 1; i <= len; i++) {
    const idx = ((from + step * i) % len + len) % len;
    if (!options[idx].disabled) return idx;
  }
  return -1;
}

export function ComboBox({
  'aria-label': ariaLabel,
  id,
  name,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  onBlur,
  onAddNew,
  addNewLabel = 'Adicionar novo',
  children,
  className,
  compact = false
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => readLegacyOptions(children), [children]);
  const normalizedOptions = options ?? parsed.options;
  const resolvedPlaceholder = placeholder ?? parsed.placeholder ?? 'Selecione...';
  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const selectedLabel = selectedOption?.displayText ?? getTextFromNode(selectedOption?.label);
  const hasAddNewAction = Boolean(onAddNew);

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!open || search === '') {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) => getTextFromNode(option.label).toLowerCase().includes(search));
  }, [normalizedOptions, open, query]);

  // Reset highlight when dropdown closes or query changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [open, query]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
        setQuery(selectedLabel);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [selectedLabel]);

  useEffect(() => {
    if (!open) {
      setQuery(selectedLabel);
    }
  }, [open, selectedLabel]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const optionCount = (options ?? parsed.options).length + (onAddNew ? 1 : 0);
    const estimatedHeight = Math.min(optionCount * 44 + 24, 260);
    const showAbove = rect.bottom + estimatedHeight + gap > viewportHeight && rect.top > estimatedHeight + gap;

    setDropdownStyle(
      showAbove
        ? { position: 'fixed', bottom: viewportHeight - rect.top + gap, top: 'auto', left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: 'fixed', top: rect.bottom + gap, bottom: 'auto', left: rect.left, width: rect.width, zIndex: 9999 }
    );
  }, [open, options, parsed.options, onAddNew]);

  function close() {
    setOpen(false);
    setQuery(selectedLabel);
    onBlur?.();
  }

  function selectOption(option: ComboBoxOption, fromKeyboard = false) {
    if (option.disabled) {
      return;
    }

    onChange?.(option.value);
    setQuery(option.displayText ?? getTextFromNode(option.label));
    setOpen(false);
    // Ao selecionar via teclado, mantém foco no input para o Tab seguinte funcionar
    if (!fromKeyboard) inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Tab') {
      close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery('');
        return;
      }
      const next = findNextEnabled(filteredOptions, highlightedIndex, 1);
      if (next >= 0) setHighlightedIndex(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return;
      const prev = findNextEnabled(filteredOptions, highlightedIndex < 0 ? filteredOptions.length : highlightedIndex, -1);
      if (prev >= 0) setHighlightedIndex(prev);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) return;
      const target =
        highlightedIndex >= 0
          ? filteredOptions[highlightedIndex]
          : filteredOptions.find((o) => !o.disabled);
      if (target) selectOption(target, true);
      return;
    }
  }

  const dropdown = open && !disabled ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="overflow-hidden rounded-xl border border-white/10 bg-surface-container-high shadow-2xl"
    >
      {filteredOptions.length === 0 && !onAddNew ? (
        <div className="px-4 py-3 text-sm font-medium text-on-surface-variant">Nenhuma opção disponível</div>
      ) : (
        <div ref={listRef} className="max-h-60 overflow-auto p-2">
          {filteredOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
                onClick={() => selectOption(option)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'bg-primary/20 text-primary'
                    : isHighlighted
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface hover:bg-primary/15 hover:text-primary'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
      {onAddNew ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => { onAddNew(); setOpen(false); }}
          className="flex w-full items-center gap-2 border-t border-white/6 px-4 py-2.5 text-left text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          {addNewLabel}
        </button>
      ) : null}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={rootRef} className={`relative w-full ${className ?? ''}`}>
      <input type="hidden" name={name} value={value ?? ''} />
      <div
        className={`flex items-stretch overflow-hidden rounded-xl bg-surface-container ring-1 ring-white/5 transition-all ${compact ? 'h-11' : 'h-[54px]'} ${
          open ? 'ring-2 ring-primary/40' : ''
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          value={open ? query : selectedLabel}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery('');
          }}
          onBlur={onBlur}
          onChange={(event) => {
            if (disabled) return;
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`min-w-0 flex-1 bg-transparent px-4 text-left font-medium text-on-surface outline-none placeholder:text-outline/50 disabled:cursor-not-allowed ${
            hasAddNewAction ? 'pr-24' : 'pr-10'
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-on-surface-variant ${
            hasAddNewAction ? 'right-14' : 'right-4'
          }`}
        >
          expand_more
        </span>
        {onAddNew && (
          <button
            type="button"
            disabled={disabled}
            onClick={onAddNew}
            aria-label={addNewLabel}
            className="flex w-10 shrink-0 items-center justify-center border-l border-white/5 bg-surface-container text-primary transition-all hover:bg-primary/15 hover:text-primary disabled:cursor-not-allowed"
          >
            <span aria-hidden="true" className="material-symbols-outlined block text-xl leading-none">
              add
            </span>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}
