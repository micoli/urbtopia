import { Fragment } from 'react';
import { UrbsSymbol } from './UrbsSymbol';

export const CURRENCY_TOKEN = '{U}';

interface CurrencyTextProps {
  text: string;
}

export function CurrencyText({ text }: CurrencyTextProps) {
  const parts = text.split(CURRENCY_TOKEN);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <UrbsSymbol /> : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}
