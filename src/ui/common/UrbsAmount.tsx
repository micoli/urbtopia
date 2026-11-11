import { UrbsSymbol } from './UrbsSymbol';

interface UrbsAmountProps {
  value: number;
  thousandSeparator?: string | null;
}

function formatAmount(value: number, thousandSeparator: string | null): string {
  const digits = (value ?? 0).toFixed(0);
  if (thousandSeparator === null) return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
}

export function UrbsAmount({ value, thousandSeparator = null }: UrbsAmountProps) {
  return (
    <span className="urbs-amount">
      {formatAmount(value, thousandSeparator)} <UrbsSymbol />
    </span>
  );
}
