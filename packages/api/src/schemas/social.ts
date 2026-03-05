import { z } from 'zod';

export const CommentAuthor = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export const Comment = z
  .object({
    id: z.string(),
    content: z.string(),
    postId: z.string(),
    authorId: z.string(),
    parentCommentId: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z
      .string()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    author: CommentAuthor,
    likeCount: z.number(),
    replyCount: z.number(),
    isLiked: z.boolean().optional(),
  })
  .meta({ id: 'Comment' });

export const PostAuthor = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export const PostDetail = z
  .object({
    id: z.string(),
    content: z.string(),
    type: z.string().optional(),
    authorId: z.string(),
    author: PostAuthor,
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z
      .string()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    likeCount: z.number(),
    commentCount: z.number(),
    shareCount: z.number(),
    isLiked: z.boolean(),
    isShared: z.boolean(),
    isRepost: z.boolean().optional(),
    isQuote: z.boolean().optional(),
    quoteComment: z.string().nullable().optional(),
    originalPostId: z.string().nullable().optional(),
    comments: z.array(Comment).optional(),
  })
  .meta({ id: 'PostDetail' });

export const Notification = z
  .object({
    id: z.string(),
    type: z.string().meta({
      description: 'Notification type (like, comment, follow, mention, etc.)',
    }),
    message: z.string(),
    read: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    actorId: z.string().optional(),
    actor: z
      .object({
        id: z.string(),
        displayName: z.string(),
        username: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
      })
      .optional(),
    postId: z.string().nullable().optional(),
    commentId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
  })
  .meta({ id: 'Notification' });

export const GroupMember = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  role: z
    .string()
    .optional()
    .meta({ description: 'Member role (owner, admin, member)' }),
  joinedAt: z.string().optional().meta({ description: 'ISO 8601 timestamp' }),
});

export const Group = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    memberCount: z.number(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    ownerId: z.string(),
  })
  .meta({ id: 'Group' });

export const GroupDetail = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    memberCount: z.number(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    ownerId: z.string(),
    members: z.array(GroupMember),
    isMember: z.boolean(),
    role: z.string().optional(),
  })
  .meta({ id: 'GroupDetail' });

export const GroupInvite = z
  .object({
    id: z.string(),
    groupId: z.string(),
    groupName: z.string(),
    inviterId: z.string(),
    inviterName: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    status: z
      .string()
      .meta({ description: 'Invite status (pending, accepted, declined)' }),
  })
  .meta({ id: 'GroupInvite' });

// ── Group request body schemas ──────────────────────────────────────────

export const CreateGroupSchema = z
  .object({
    name: z.string().min(1).max(100),
    memberIds: z.array(z.string()).optional().default([]),
    requiredNftContractAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format')
      .optional(),
    requiredNftTokenId: z.number().int().min(0).nullable().optional(),
    requiredNftChainId: z.number().int().positive().optional(),
  })
  .meta({ id: 'CreateGroupSchema' });

export const UpdateGroupSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .meta({ id: 'UpdateGroupSchema' });

export const AddMemberSchema = z
  .object({
    userId: z.string(),
  })
  .meta({ id: 'AddMemberSchema' });

export const PromoteAdminSchema = z
  .object({
    userId: z.string(),
  })
  .meta({ id: 'PromoteAdminSchema' });

export const inviteIdPath = z.object({
  inviteId: z.string().meta({ description: 'Group invite ID' }),
});

export const groupIdPath = z.object({
  groupId: z.string().meta({ description: 'Group ID' }),
});

export const AcceptInviteResponse = z
  .object({
    success: z.literal(true),
    groupId: z.string(),
    chatId: z.string().nullable(),
  })
  .meta({ id: 'AcceptInviteResponse' });

export const DeclineInviteResponse = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: 'DeclineInviteResponse' });

export const AddGroupMemberBody = z
  .object({
    userId: z.string().meta({ description: 'User ID to add to the group' }),
  })
  .meta({ id: 'AddGroupMemberBody' });

export const AddGroupMemberResponse = z
  .object({
    success: z.literal(true),
    added: z.boolean().meta({ description: 'Whether the user was directly added (agents/NPCs)' }),
    invited: z.boolean().meta({ description: 'Whether an invite was sent (human users)' }),
  })
  .meta({ id: 'AddGroupMemberResponse' });

export const RemoveGroupMemberResponse = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: 'RemoveGroupMemberResponse' });

export const PromoteAdminBody = z
  .object({
    userId: z.string().meta({ description: 'User ID to promote to admin' }),
  })
  .meta({ id: 'PromoteAdminBody' });

export const PromoteAdminResponse = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: 'PromoteAdminResponse' });

export const DemoteAdminResponse = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: 'DemoteAdminResponse' });
