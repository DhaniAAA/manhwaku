import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,

    // Replay may not be fully supported on Glitchtip natively or without explicit config,
    // but we can initialize it just in case, or keep it minimal
});
