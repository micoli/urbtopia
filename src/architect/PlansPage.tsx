import { Fragment, useRef, useState } from 'react';
import type { PlanLibrary } from './planLibrary.ts';
import { ActionButton } from '../ui/common/ActionButton.tsx';
import { Dialog } from '../ui/common/Dialog.tsx';
import { Icon } from '../ui/common/Icon.tsx';
import { IconButton } from '../ui/common/IconButton.tsx';
import { Note } from '../ui/common/Note.tsx';
import { SectionHeading } from '../ui/common/SectionHeading.tsx';
import { exportPlanGlb } from './exportGlb.ts';
import { t } from '../i18n/t';
import type { ArchitectMessageKey } from '../i18n/architect';
import { uniquePlanName } from './planNames.ts';
import { parsePlan, type Plan, type Shape } from '../core/architect/housePlan.ts';
import { OpenPlanCard, type OpenPlanStatus } from './OpenPlanCard.tsx';
import { SavedPlanCard } from './SavedPlanCard.tsx';
import { TemplatePicker } from './TemplatePicker.tsx';

interface PlansPageProps {
  plan?: Plan;
  library: PlanLibrary;
  name: string;
  onName: (name: string) => void;
  onCreate: (shape: Shape, name: string) => void;
  onOpen: (plan: Plan, name: string) => void;
  onBack?: () => void;
  onDiscard: () => void;
  standalone?: boolean;
  onClose?: () => void;
}

// The plans of the player, on a page of their own: creating a plan is the only moment its shape is chosen.
export function PlansPage({ plan, library, name, onName, onCreate, onOpen, onBack, onDiscard, standalone = false, onClose }: PlansPageProps) {
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState<string>();
  const picker = useRef<HTMLInputElement>(null);

  const save = () => {
    const key = name.trim();
    if (!key || !plan) return;
    library.save(key, plan);
  };

  const remove = (key: string) => {
    library.remove(key);
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

  const names = [...library.names].sort();
  const openName = name.trim();
  const savedOpen = plan ? library.load(openName) : undefined;
  const statusOfOpenPlan: OpenPlanStatus = !savedOpen ? 'new' : JSON.stringify(savedOpen) === JSON.stringify(plan) ? 'saved' : 'edited';
  const openCard = plan && (
    <OpenPlanCard name={name} plan={plan} status={statusOfOpenPlan} houses={library.houseCount?.(openName)} onName={onName} onContinue={onBack!} onSave={save} onClosePlan={onDiscard}>
      {standalone && (
        <div className="studio-saved__actions">
          <ActionButton size="sm" onClick={() => download(new Blob([JSON.stringify({ version: 1, name: openName || 'plan', plan }, null, 2)], { type: 'application/json' }), 'json')}>
            {t('architect.exportJson')}
          </ActionButton>
          <ActionButton size="sm" onClick={() => void exportPlanGlb(plan).then((blob) => download(blob, 'glb'))}>
            {t('architect.exportGlb')}
          </ActionButton>
        </div>
      )}
    </OpenPlanCard>
  );
  return (
    <main className="studio-page">
      <header className="studio-page__header">
        <SectionHeading>{t('architect.plans')}</SectionHeading>
        {onClose && (
          <IconButton label={t('architect.close')} onClick={onClose}>
            <Icon name="close" />
          </IconButton>
        )}
      </header>

      {creating ? (
        <TemplatePicker
          onPick={(shape) => {
            setCreating(false);
            onCreate(shape, uniquePlanName(t('architect.plan.defaultName'), library.names));
          }}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <>
          <div className="studio-row">
            {standalone && (
              <>
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
              </>
            )}
          </div>
          {message && <Note tone="danger">{message}</Note>}

          <ActionButton variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="build" /> {t('architect.new')}
          </ActionButton>

          {!plan && names.length === 0 && <p className="studio-hint">{t('architect.none')}</p>}
          <ul className="studio-plan-list">
            {plan && !savedOpen && openCard}
            {names.map((key) => (plan && key === openName ? <Fragment key={key}>{openCard}</Fragment> : <SavedPlanCard key={key} name={key} plan={library.load(key)!} houses={library.houseCount?.(key)} disabled={plan !== undefined} onOpen={() => onOpen(structuredClone(library.load(key)!), key)} onDelete={() => setDeleting(key)} />))}
          </ul>
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
