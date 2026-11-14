import type { BuildingType } from '../../core';
import { t } from '../../i18n/t';

interface InteriorEntryLinkProps {
  type: BuildingType;
}

export const interiorEntryIdOf = (type: BuildingType): string => `interior-${type}`;

// Jumps to the entry of an interior further down the page.
export function InteriorEntryLink({ type }: InteriorEntryLinkProps) {
  const id = interiorEntryIdOf(type);
  return (
    <a
      href={`#${id}`}
      onClick={event => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
      }}
    >
      {t(`building.${type}`)}
    </a>
  );
}
