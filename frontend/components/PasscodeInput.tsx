"use client";

import React from "react";

type PasscodeInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
};

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

export default function PasscodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  className,
}: PasscodeInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastCompletedRef = React.useRef<string | null>(null);

  const digits = React.useMemo(() => {
    const clean = onlyDigits(value).slice(0, length);
    const arr = Array.from({ length }, (_, i) => clean[i] ?? "");
    return arr;
  }, [value, length]);

  const setDigits = React.useCallback(
    (nextDigits: string[]) => {
      const joined = nextDigits.map((d) => (d ? d[0] : "")).join("").slice(0, length);
      onChange(joined);
    },
    [onChange, length]
  );

  const focusIndex = React.useCallback((idx: number) => {
    const el = inputsRef.current[idx];
    el?.focus();
    el?.select?.();
  }, []);

  React.useEffect(() => {
    const joined = digits.join("");
    if (joined.length === length && !digits.includes("")) {
      if (lastCompletedRef.current !== joined) {
        lastCompletedRef.current = joined;
        onComplete?.(joined);
      }
    } else {
      lastCompletedRef.current = null;
    }
  }, [digits, length, onComplete]);

  React.useEffect(() => {
    if (!autoFocus) return;
    // focus first empty input
    const firstEmpty = digits.findIndex((d) => !d);
    focusIndex(firstEmpty === -1 ? length - 1 : firstEmpty);
  }, [autoFocus, digits, focusIndex, length]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    const pasted = onlyDigits(e.clipboardData.getData("text")).slice(0, length);
    if (pasted.length !== length) return;
    setDigits(Array.from({ length }, (_, i) => pasted[i] ?? ""));
    focusIndex(length - 1);
  };

  const handleChange = (idx: number, raw: string) => {
    if (disabled) return;
    const incoming = onlyDigits(raw);
    if (!incoming) {
      const next = [...digits];
      next[idx] = "";
      setDigits(next);
      return;
    }

    // If user typed multiple digits (mobile autocomplete), spread across inputs from idx.
    const chars = incoming.split("");
    const next = [...digits];
    for (let i = 0; i < chars.length && idx + i < length; i++) {
      next[idx + i] = chars[i];
    }
    setDigits(next);

    const nextFocus = Math.min(idx + chars.length, length - 1);
    focusIndex(nextFocus);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = "";
        setDigits(next);
        return;
      }
      if (idx > 0) focusIndex(idx - 1);
      return;
    }

    if (key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusIndex(idx - 1);
      return;
    }
    if (key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      focusIndex(idx + 1);
      return;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            value={d}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            pattern="\d*"
            maxLength={length} // allow multi-digit entry; we handle spreading
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            disabled={disabled}
            className="h-14 w-12 rounded-xl border border-gray-300 bg-white text-center text-xl font-semibold tracking-widest text-gray-900 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            aria-label={`Passcode digit ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


