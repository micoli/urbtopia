import { useRef, useState } from 'react';
import { ActionButton } from '../../../src/ui/common/ActionButton.tsx';
import { Dialog } from '../../../src/ui/common/Dialog.tsx';
import { Icon } from '../../../src/ui/common/Icon.tsx';
import { IconButton } from '../../../src/ui/common/IconButton.tsx';
import { Note } from '../../../src/ui/common/Note.tsx';
import { SectionHeading } from '../../../src/ui/common/SectionHeading.tsx';
import { TextFieldWithEditor } from '../../../src/ui/common/TextFieldWithEditor.tsx';
import { exportPlanGlb } from './exportGlb.ts';
import { t } from './i18n.ts';
import type { ArchitectMessageKey } from './messages.ts';
import { uniquePlanName } from './planNames.ts';
import { parsePlan, type Plan, type Shape } from './model.ts';
import { TemplatePicker } from './TemplatePicker.tsx';

const STORAGE_KEY = 'architect-studio:plans';

function readLibrary(): Record<string, Plan> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Plan>;
  } catch {
    return {};
  }
}

function writeLibrary(library: Record<string, Plan>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

interface PlansPageProps {
  plan?: Plan;
  name: string;
  onName: (name: string) => void;
  onCreate: (shape: Shape, name: string) => void;
  onOpen: (plan: Plan, name: string) => void;
  onBack?: () => void;
}

// The plans of the player, on a page of their own: creating a plan is the only moment its shape is chosen.
export function PlansPage({ plan, name, onName, onCreate, onOpen, onBack }: PlansPageProps) {
  const [library, setLibrary] = useState(readLibrary);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState<string>();
  const picker = useRef<HTMLInputElement>(null);

  const save = () => {
    const key = name.trim();
    if (!key || !plan) return;
    const next = { ...readLibrary(), [key]: structuredClone(plan) };
    writeLibrary(next);
    setLibrary(next);
  };

  const remove = (key: string) => {
    const next = readLibrary();
    delete next[key];
    writeLibrary(next);
    setLibrary(next);
  };

  const download = (blob: Blob, extension: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(name.trim() || 'plan').replace(/[^\w-]+/g, '-')}.${extension}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const result = parsePlan(await file.text());
    if ('error' in result) {
      setMessage(t(`architect.error.${result.error}` as ArchitectMessageKey));
      return;
    }
    setMessage('');
    onOpen(result.plan, result.name ?? file.name.replace(/\.json$/i, ''));
  };

  const names = Object.keys(library).sort();
  return (
    <main className="studio-page">
      <header className="studio-page__header">
        <SectionHeading>{t('architect.plans')}</SectionHeading>
        {onBack && (
          <ActionButton size="sm" onClick={onBack}>
            <Icon name="arrowLeft" /> {t('architect.plans.back')}
          </ActionButton>
        )}
      </header>

      {creating ? (
        <TemplatePicker
          onPick={(shape) => {
            setCreating(false);
            onCreate(shape, uniquePlanName(t('architect.plan.defaultName'), Object.keys(readLibrary())));
          }}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <>
          <div className="studio-row">
            <ActionButton variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Icon name="build" /> {t('architect.new')}
            </ActionButton>
            <ActionButton size="sm" onClick={() => picker.current?.click()}>
              {t('architect.importJson')}
            </ActionButton>
            <input
              ref={picker}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                void importJson(file);
              }}
            />
          </div>
          {message && <Note tone="danger">{message}</Note>}

          <SectionHeading>{t('architect.plans.current')}</SectionHeading>
          {plan ? (
            <>
              <div className="studio-row">
                <TextFieldWithEditor label={t('architect.plan.name')} placeholder={t('architect.plan.name')} value={name} onChange={onName} onSubmit={save} />
                <ActionButton size="sm" onClick={save}>
                  {t('architect.save')}
                </ActionButton>
              </div>
              <div className="studio-row">
                <ActionButton size="sm" onClick={() => download(new Blob([JSON.stringify({ version: 1, name: name.trim() || 'plan', plan }, null, 2)], { type: 'application/json' }), 'json')}>
                  {t('architect.exportJson')}
                </ActionButton>
                <ActionButton size="sm" onClick={() => void exportPlanGlb(plan).then((blob) => download(blob, 'glb'))}>
                  {t('architect.exportGlb')}
                </ActionButton>
              </div>
            </>
          ) : (
            <p className="studio-hint">{t('architect.plans.noCurrent')}</p>
          )}

          <SectionHeading>{t('architect.plans.saved')}</SectionHeading>
          {names.length === 0 && <p className="studio-hint">{t('architect.none')}</p>}
          {names.map((key) => (
            <div key={key} className="studio-saved">
              <span>{key}</span>
              <ActionButton size="sm" onClick={() => onOpen(structuredClone(library[key]!), key)}>
                {t('architect.load')}
              </ActionButton>
              <IconButton label={t('architect.delete')} onClick={() => setDeleting(key)}>
                <Icon name="close" />
              </IconButton>
            </div>
          ))}
        </>
      )}
      {deleting !== undefined && (
        <Dialog role="alertdialog" onClose={() => setDeleting(undefined)}>
          <Dialog.Title>{t('architect.delete')}</Dialog.Title>
          <Dialog.Body>
            <p>{t('architect.deleteConfirm').replace('{name}', deleting)}</p>
          </Dialog.Body>
          <Dialog.Actions>
            <ActionButton onClick={() => setDeleting(undefined)}>{t('architect.plans.cancel')}</ActionButton>
            <ActionButton
              variant="danger"
              onClick={() => {
                remove(deleting);
                setDeleting(undefined);
              }}
            >
              {t('architect.delete')}
            </ActionButton>
          </Dialog.Actions>
        </Dialog>
      )}
    </main>
  );
}
