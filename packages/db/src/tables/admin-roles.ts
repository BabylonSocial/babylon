import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VIEWER'] as const;
export type AdminRoleType = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  'view_stats',
  'view_users',
  'manage_users',
  'view_trading',
  'view_system',
  'give_feedback',
  'manage_admins',
  'manage_game',
  'view_reports',
  'resolve_reports',
  'manage_escrow',
  'view_alpha_groups',
  'manage_alpha_groups',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<AdminRoleType, AdminPermission[]> = {
  SUPER_ADMIN: [...ADMIN_PERMISSIONS],
  ADMIN: [
    'view_stats',
    'view_users',
    'manage_users',
    'view_trading',
    'view_system',
    'give_feedback',
    'view_reports',
    'resolve_reports',
    'view_alpha_groups',
    'manage_alpha_groups',
    // NOTE: manage_game, manage_escrow, manage_admins are SUPER_ADMIN only
  ],
  VIEWER: [
    'view_stats',
    'view_users',
    'view_trading',
    'view_system',
    'view_alpha_groups',
  ],
};

export const adminRoles = pgTable(
  'AdminRole',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id),
    role: text('role').notNull().$type<AdminRoleType>(),
    permissions: text('permissions').array().$type<AdminPermission[]>(),
    grantedBy: text('grantedBy')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    grantedAt: timestamp('grantedAt', { mode: 'date' }).notNull().defaultNow(),
    revokedAt: timestamp('revokedAt', { mode: 'date' }),
  },
  (table) => [
    index('AdminRole_role_idx').on(table.role),
    index('AdminRole_userId_idx').on(table.userId),
    index('AdminRole_grantedAt_idx').on(table.grantedAt),
    index('AdminRole_revokedAt_idx').on(table.revokedAt),
  ]
);

export const adminRolesRelations = relations(adminRoles, ({ one }) => ({
  user: one(users, {
    fields: [adminRoles.userId],
    references: [users.id],
  }),
  granter: one(users, {
    fields: [adminRoles.grantedBy],
    references: [users.id],
    relationName: 'AdminRole_grantedByToUser',
  }),
}));

export type AdminRole = typeof adminRoles.$inferSelect;
export type NewAdminRole = typeof adminRoles.$inferInsert;
