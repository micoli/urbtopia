import { Fragment } from 'react';
import { codexImageKey } from '../../codex/catalog';
import type { BuildingType } from '../../core';
import { t } from '../../i18n/t';
import { useCodexManifest } from '../codex/useCodexManifest';

const DOCKS = {
  'dock.build': { image: 'bulldozer.png', label: 'dock.build' },
  'dock.networks': { image: 'infrastructure-networks.png', label: 'dock.networks' },
} as const;

type DockToken = keyof typeof DOCKS;

const isDockToken = (token: string): token is DockToken => token in DOCKS;

interface TutorialTextProps {
  text: string;
}

export function TutorialText({ text }: TutorialTextProps) {
  const { manifest } = useCodexManifest();

  const chip = (token: string) => {
    if (isDockToken(token)) {
      const dock = DOCKS[token];
      return <TutorialChip src={`${import.meta.env.BASE_URL}assets/icons/${dock.image}`} label={t(dock.label)} />;
    }
    const image = manifest?.images[codexImageKey(token as BuildingType, 1)];
    const label = token === 'road' ? t('tool.road') : t(`building.${token as BuildingType}`);
    return <TutorialChip src={image ? `${import.meta.env.BASE_URL}codex/${image}` : undefined} label={label} />;
  };

  return (
    <>
      {text.split(/\{([\w.]+)\}/).map((part, index) => (
        <Fragment key={index}>{index % 2 === 1 ? chip(part) : part}</Fragment>
      ))}
    </>
  );
}

function TutorialChip({ src, label }: { src?: string; label: string }) {
  return (
    <span className="tutorial-chip">
      {src ? <img src={src} alt="" draggable={false} /> : null}
      {label}
    </span>
  );
}
