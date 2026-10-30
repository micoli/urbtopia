import { flagOfCommand, isFlagEnabled } from '../featureFlags/featureFlags';
import { createCommandGateway } from './commandGateway';
import { readOnlyStore } from './readOnlyStore';
import { toastKeyForEvents, toastStore } from './toastStore';

export const liveCommandGateway = createCommandGateway({
  isReadOnly: () => readOnlyStore.getState().readOnly,
  now: () => Date.now(),
  isCommandEnabled: command => {
    const flag = flagOfCommand(command.type);
    return flag === undefined || isFlagEnabled(flag);
  },
  toastForEvents: toastKeyForEvents,
  showToast: (key) => toastStore.getState().show(key),
});
