// System One decision layer. Application code calls `context.systemOne.decide`
// and never needs to know the provider (currently TypeSafe's Jev through
// OpenRouter), the endpoint, or how authentication works. Server-only: the
// client is created in apps/web/src/services.ts from server env and reaches
// routers through the oRPC context.
export { createSystemOne, SystemOneError, type SystemOneErrorCode } from "./client";
export type * from "./types";
