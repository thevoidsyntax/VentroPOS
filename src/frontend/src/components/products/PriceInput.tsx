import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn, formatNumber } from '@/lib/utils';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  disabled?: boolean;
}

export function PriceInput({ value, onChange, error, className, disabled }: PriceInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState('');

  useEffect(() => {
    if (!isFocused) {
      setRawValue(value);
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setRawValue(value);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setRawValue(raw);
    onChange(raw);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        Rp
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={isFocused ? rawValue : formatNumber(parseInt(rawValue || '0'))}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0"
        disabled={disabled}
        className={cn('pl-10 font-mono', error && 'border-destructive', className)}
      />
    </div>
  );
}
