import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { PACK_CREDITS, POLY_PIZZA_CREDITS } from '../../credits/credits';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { useDialogs } from '../common/hooks';

export function CreditsDialog() {
  const open = useDialogs((store) => store.creditsOpen);
  if (!open) return null;

  return (
    <Dialog className="credits-dialog">
      <Dialog.Title>{t('credits.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="credits-body">
          <ul className="credits-list">
            {PACK_CREDITS.map((pack) => (
              <li key={pack.name}>
                <a href={pack.url} target="_blank" rel="noreferrer">{pack.name}</a> ({pack.licence})
              </li>
            ))}
          </ul>
          <h3>{t('credits.polyPizza')}</h3>
          <ul className="credits-list">
            {POLY_PIZZA_CREDITS.map((credit) => (
              <li key={credit.source}>
                <a href={credit.source} target="_blank" rel="noreferrer">{credit.title}</a> {t('credits.by')} {credit.author} (
                {credit.licenceUrl ? <a href={credit.licenceUrl} target="_blank" rel="noreferrer">{credit.licence}</a> : credit.licence})
              </li>
            ))}
          </ul>
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={() => dialogStore.getState().setCreditsOpen(false)}>{t('panel.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
