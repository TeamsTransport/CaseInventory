import { useEffect, useMemo, useRef, useState } from "react";

export type ComboOption<V extends string | number = number> = {
  value: V;
  label: string;
};

type Props<V extends string | number = number> = {
  name?: string;                     // Useful when used inside <form> (hidden input)
  value: V | "" | null | undefined;  // Controlled selection (null/"" => none)
  onChange: (value: V | null) => void;
  options: ComboOption<V>[];
  placeholder?: string;
  allowEmpty?: boolean;              // If true, allow no selection
  emptyLabel?: string;               // Label for "no selection"
  disabled?: boolean;
  className?: string;                // Extra class for the wrapper
  inputClassName?: string;           // Tailwind for the input
  menuClassName?: string;            // Tailwind for the dropdown menu
};

export default function SearchableComboBox<V extends string | number = number>({
  name,
  value,
  onChange,
  options,
  placeholder = "Search…",
  allowEmpty = true,
  emptyLabel = "No selection",
  disabled = false,
  className = "",
  inputClassName = "",
  menuClassName = "",
}: Props<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    if (value === null || value === "" || value === undefined) return null;
    return options.find(o => String(o.value) === String(value)) ?? null;
  }, [value, options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const labelToShow = selectedOption?.label ?? "";

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Reset query when opening or when selection changes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function handleInputFocus() {
    if (!disabled) setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            const chosen = filtered[activeIndex];
            onChange(chosen.value);
            setOpen(false);
          }
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function chooseOption(opt: ComboOption<V>) {
    onChange(opt.value);
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearSelection() {
    onChange(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* hidden input for forms */}
      {name && (
        <input type="hidden" name={name} value={value ?? ""} />
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className={`input input-bordered w-full ${inputClassName}`}
          value={open ? query : labelToShow}
          placeholder={placeholder}
          onFocus={handleInputFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="combobox-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `combobox-option-${activeIndex}` : undefined
          }
        />

        {allowEmpty && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={clearSelection}
            title="Clear"
            disabled={disabled || value === null || value === "" || value === undefined}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul
          id="combobox-listbox"
          role="listbox"
          className={`menu bg-base-100 rounded-box shadow-xl absolute left-0 right-0 mt-1 max-h-64 overflow-auto z-50 ${menuClassName}`}
        >
          {allowEmpty && (
            <li>
              <button
                type="button"
                className="justify-start"
                onClick={clearSelection}
              >
                {emptyLabel}
              </button>
            </li>
          )}
          {filtered.length === 0 && (
            <li className="disabled">
              <span>No matches</span>
            </li>
          )}
          {filtered.map((opt, i) => (
            <li key={String(opt.value)}>
              <button
                id={`combobox-option-${i}`}
                role="option"
                aria-selected={String(value) === String(opt.value)}
                className={`justify-start ${i === activeIndex ? "active" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => chooseOption(opt)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
