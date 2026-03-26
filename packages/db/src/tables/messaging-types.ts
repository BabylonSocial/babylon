import type { GroupInvite } from './group-invites';
import type { GroupMember } from './group-members';

export type GroupType = 'user' | 'npc' | 'agent' | 'team';
export type GroupMemberRole = 'owner' | 'admin' | 'member';
export type GroupInviteStatus = 'pending' | 'accepted' | 'declined';
export type { MessageType } from '@babylon/shared';

export type GroupMemberGrandfatherFields = Pick<
  GroupMember,
  'isGrandfathered' | 'grandfatheredAt'
>;
export type GroupInviteDecayFields = Pick<
  GroupInvite,
  'declineCount' | 'lastDeclinedAt' | 'nextEligibleAt'
>;
