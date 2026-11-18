import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    release: __RELEASE_NAME__,
    environment: import.meta.env.DEV ? 'development' : 'production',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  });
}
