import { createCommandGateway } from './commandGateway';
import { readOnlyStore } from './readOnlyStore';
import { toastKeyForEvents, toastStore } from './toastStore';

export const liveCommandGateway = createCommandGateway({
  isReadOnly: () => readOnlyStore.getState().readOnly,
  now: () => Date.now(),
  toastForEvents: toastKeyForEvents,
  showToast: (key) => toastStore.getState().show(key),
});
