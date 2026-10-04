import { UrbsSymbol } from './UrbsSymbol';

interface UrbsAmountProps {
  value: number;
}

export function UrbsAmount({ value }: UrbsAmountProps) {
  return (
    <span className="urbs-amount">
      {(value??0).toFixed(0)} <UrbsSymbol />
    </span>
  );
}
