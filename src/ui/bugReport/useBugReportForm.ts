import { useEffect, useState } from 'react';
import { getBugReportClient } from '../../bugReports/bugReportClientHandle';
import { buildSubmission, canSend, type ImageChoice } from '../../bugReports/buildSubmission';
import { prepareCityAttachment, type CityAttachmentResult } from '../../bugReports/cityAttachment';
import { collectReportContext } from '../../bugReports/collectReportContext';
import type { ReportSnapshot } from '../../bugReports/liveReportSnapshot';
import { BugReportError } from '../../bugReports/types';
import type { MessageKey } from '../../i18n/messages';
import { toastStore } from '../../store/toastStore';
import { bugReportErrorKey } from './bugReportErrorKey';

// What the player typed survives closing the form, not a page reload.
let keptDescription = '';

export interface BugReportForm {
  description: string;
  setDescription: (text: string) => void;
  image: ImageChoice;
  setImage: (choice: ImageChoice) => void;
  attachCity: boolean;
  setAttachCity: (attach: boolean) => void;
  cityTooLarge: boolean;
  cityReady: boolean;
  sending: boolean;
  errorKey: MessageKey | null;
  canSend: boolean;
  send: () => Promise<void>;
}

export function useBugReportForm(snapshot: ReportSnapshot, onSent: () => void): BugReportForm {
  const [description, setDescriptionState] = useState(keptDescription);
  const [image, setImage] = useState<ImageChoice>(snapshot.map ? 'map' : 'none');
  const [attachCity, setAttachCity] = useState(true);
  const [city, setCity] = useState<CityAttachmentResult | null>(null);
  const [sending, setSending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  useEffect(() => {
    let current = true;
    void prepareCityAttachment(snapshot.cityText).then((result) => current && setCity(result));
    return () => {
      current = false;
    };
  }, [snapshot.cityText]);

  const cityTooLarge = city?.ok === false && city.reason === 'too-large';
  const cityAttachment = city?.ok ? city.attachment : null;

  const setDescription = (text: string) => {
    keptDescription = text;
    setDescriptionState(text);
  };

  const send = async () => {
    if (sending || !canSend(description)) return;
    setSending(true);
    setErrorKey(null);
    try {
      const client = await getBugReportClient();
      if (!client) throw new BugReportError('unknown');
      await client.send(buildSubmission({ description, image, attachCity: attachCity && cityAttachment !== null }, snapshot, cityAttachment, collectReportContext()));
      keptDescription = '';
      toastStore.getState().show('bugReport.done');
      onSent();
    } catch (error) {
      setErrorKey(bugReportErrorKey(error));
      setSending(false);
    }
  };

  return { description, setDescription, image, setImage, attachCity: attachCity && !cityTooLarge, setAttachCity, cityTooLarge, cityReady: city !== null, sending, errorKey, canSend: canSend(description), send };
}
