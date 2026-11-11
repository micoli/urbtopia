import { flagOfCommandIn, isFlagEnabled } from '../featureFlags/featureFlags';
import { createCommandGateway } from './commandGateway';
import { readOnlyStore } from './readOnlyStore';
import { announceEvents, toastStore } from './toastStore';

export const liveCommandGateway = createCommandGateway({
  isReadOnly: () => readOnlyStore.getState().readOnly,
  now: () => Date.now(),
  isCommandEnabled: (command, state) => {
    const flag = flagOfCommandIn(command, state);
    return flag === undefined || isFlagEnabled(flag);
  },
  announceEvents,
  showToast: (key) => toastStore.getState().show(key),
});
