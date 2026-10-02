"use client";

import { ChevronDown, Loader2, X } from "lucide-react";

import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type AutocompleteSelectOption = {
  value: string;

  label: string;

  searchText?: string;

  disabled?: boolean;
};

type AutocompleteSelectProps = {
  id?: string;

  value: string;

  options: AutocompleteSelectOption[];

  onChange: (value: string, option?: AutocompleteSelectOption) => void;

  placeholder?: string;

  loading?: boolean;

  disabled?: boolean;

  emptyText?: string;

  loadingText?: string;

  clearLabel?: string;

  startIcon?: ReactNode;

  className?: string;

  inputClassName?: string;

  allowClear?: boolean;
};

const normalizeSearch = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

export function AutocompleteSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "",
  loading = false,
  disabled = false,
  emptyText = "Không tìm thấy kết quả",
  loadingText = "Đang tải...",
  clearLabel = "Xóa lựa chọn",
  startIcon,
  className,
  inputClassName,
  allowClear = true,
}: AutocompleteSelectProps) {
  const generatedId = useId();

  const inputId = id ?? `autocomplete-${generatedId}`;

  const rootRef = useRef<HTMLDivElement | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [open, setOpen] = useState(false);

  const [inputValue, setInputValue] = useState("");

  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const keyword = normalizeSearch(inputValue);

    if (!keyword) {
      return options;
    }

    return options.filter((option) => {
      const searchable = normalizeSearch(
        [option.label, option.value, option.searchText ?? ""].join(" ")
      );

      return searchable.includes(keyword);
    });
  }, [inputValue, options]);

  useEffect(() => {
    if (open) {
      return;
    }

    if (selectedOption) {
      setInputValue(selectedOption.label);

      return;
    }

    if (value) {
      setInputValue(value);

      return;
    }

    setInputValue("");
  }, [open, selectedOption, value]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);

      return;
    }

    const firstEnabledIndex = filteredOptions.findIndex(
      (option) => !option.disabled
    );

    setActiveIndex(firstEnabledIndex);
  }, [filteredOptions, open]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    optionRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (rootRef.current.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  const selectOption = (option: AutocompleteSelectOption) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value, option);

    setInputValue(option.label);

    setOpen(false);

    setActiveIndex(-1);
  };

  const clearValue = () => {
    if (disabled || loading) {
      return;
    }

    onChange("");

    setInputValue("");

    setOpen(true);

    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const moveActiveIndex = (direction: 1 | -1) => {
    if (filteredOptions.length === 0) {
      return;
    }

    let nextIndex = activeIndex;

    for (let attempt = 0; attempt < filteredOptions.length; attempt += 1) {
      nextIndex += direction;

      if (nextIndex >= filteredOptions.length) {
        nextIndex = 0;
      }

      if (nextIndex < 0) {
        nextIndex = filteredOptions.length - 1;
      }

      if (!filteredOptions[nextIndex]?.disabled) {
        setActiveIndex(nextIndex);

        return;
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        setOpen(true);

        return;
      }

      moveActiveIndex(1);

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);

        return;
      }

      moveActiveIndex(-1);

      return;
    }

    if (event.key === "Enter") {
      if (!open) {
        return;
      }

      event.preventDefault();

      const option = filteredOptions[activeIndex];

      if (option) {
        selectOption(option);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setOpen(false);

      setInputValue(selectedOption?.label ?? "");

      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const showClear = allowClear && !!value && !loading && !disabled;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        {startIcon && (
          <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center text-slate-400">
            {startIcon}
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${inputId}-listbox`}
          autoComplete="off"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled || loading}
          onFocus={() => {
            if (disabled || loading) {
              return;
            }

            setOpen(true);

            if (selectedOption && inputValue === selectedOption.label) {
              setInputValue("");
            }
          }}
          onChange={(event) => {
            setInputValue(event.target.value);

            if (!open) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-12 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400",
            "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            startIcon ? "pl-12" : "pl-4",
            showClear ? "pr-20" : "pr-12",
            inputClassName
          )}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
          {loading ? (
            <div className="flex size-8 items-center justify-center text-slate-400">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            <>
              {showClear && (
                <button
                  type="button"
                  aria-label={clearLabel}
                  title={clearLabel}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={clearValue}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              )}

              <button
                type="button"
                tabIndex={-1}
                aria-label={placeholder}
                disabled={disabled}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  if (disabled) {
                    return;
                  }

                  inputRef.current?.focus();

                  setOpen((current) => !current);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {open && !disabled && !loading && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-slate-500">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const selected = option.value === value;

              const active = activeIndex === index;

              return (
                <button
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition",
                    selected && "bg-emerald-50 font-semibold text-emerald-800",
                    !selected && active && "bg-slate-100 text-slate-900",
                    !selected && !active && "text-slate-700 hover:bg-slate-50",
                    option.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {loading && <div className="sr-only">{loadingText}</div>}
    </div>
  );
}
