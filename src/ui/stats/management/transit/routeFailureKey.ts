import type { RouteFailure } from '../../../../core/transit/transitService.ts';
import type { MessageKey } from '../../../../i18n/messages.ts';

const FAILURE_KEYS: Record<RouteFailure, MessageKey> = {
  invalid: 'error.invalidBusLine',
  stopNotOnNetwork: 'error.stopNotOnNetwork',
  notConnected: 'error.networkNotConnected',
};

export const routeFailureKey = (failure: RouteFailure): MessageKey => FAILURE_KEYS[failure];
