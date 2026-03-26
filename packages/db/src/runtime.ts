/**
 * Database runtime — connection, RLS helpers, Drizzle table symbols, JSON snapshot hooks.
 *
 * Application and integration code wires the DB through this entry.
 * Prefer `@babylon/db` for operators, row types (`export type * from './tables'`), and services.
 */

export * from './db';

import * as tables from './tables';
export { tables };
export * from './tables';
