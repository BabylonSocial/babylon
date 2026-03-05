import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  CommentAuthor,
  Comment,
  PostAuthor,
  PostDetail,
  Notification,
  Group,
  GroupDetail,
  GroupInvite,
  inviteIdPath,
  groupIdPath,
  AcceptInviteResponse,
  DeclineInviteResponse,
  AddGroupMemberBody,
  AddGroupMemberResponse,
  RemoveGroupMemberResponse,
  PromoteAdminBody,
  PromoteAdminResponse,
  DemoteAdminResponse,
} from '../../schemas/social';

export const socialPaths: ZodOpenApiPathsObject = {
  '/api/comments/{id}': {
    get: {
      operationId: 'getCommentById',
      tags: ['Comments'],
      summary: 'Get comment by ID',
      description:
        'Returns a comment with its replies, parent chain, and associated post.',
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Comment ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Comment details',
          content: {
            'application/json': {
              schema: z
                .object({
                  comment: Comment,
                  replies: z.array(Comment),
                  parentChain: z.array(Comment),
                  post: z.object({
                    id: z.string(),
                    content: z.string(),
                    authorId: z.string(),
                    author: PostAuthor,
                  }),
                })
                .meta({ id: 'GetCommentResponse' }),
            },
          },
        },
        '404': { description: 'Comment not found' },
      },
    },
  },

  '/api/comments/{id}/like': {
    post: {
      operationId: 'likeComment',
      tags: ['Comments'],
      summary: 'Like a comment',
      description: 'Adds a like to the specified comment.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Comment ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Like result',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  id: z.string(),
                  commentId: z.string(),
                  likeCount: z.number(),
                  isLiked: z.literal(true),
                  createdAt: z
                    .string()
                    .meta({ description: 'ISO 8601 timestamp' }),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Comment not found' },
      },
    },
    delete: {
      operationId: 'unlikeComment',
      tags: ['Comments'],
      summary: 'Unlike a comment',
      description: 'Removes a like from the specified comment.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Comment ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Unlike result',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  commentId: z.string(),
                  likeCount: z.number(),
                  isLiked: z.literal(false),
                  message: z.string(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Comment not found' },
      },
    },
  },

  '/api/comments/{id}/replies': {
    post: {
      operationId: 'replyToComment',
      tags: ['Comments'],
      summary: 'Reply to a comment',
      description: 'Creates a reply to the specified comment.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Parent comment ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              content: z.string().meta({ description: 'Reply content' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created reply',
          content: {
            'application/json': {
              schema: z
                .object({
                  id: z.string(),
                  content: z.string(),
                  postId: z.string(),
                  authorId: z.string(),
                  parentCommentId: z.string(),
                  createdAt: z
                    .string()
                    .meta({ description: 'ISO 8601 timestamp' }),
                  author: CommentAuthor,
                  likeCount: z.number(),
                  replyCount: z.number(),
                })
                .meta({ id: 'CommentReplyResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Comment not found' },
      },
    },
  },

  '/api/posts/{id}': {
    get: {
      operationId: 'getPostById',
      tags: ['Posts'],
      summary: 'Get post by ID',
      description:
        'Returns a full post with author details, comments, and interaction counts.',
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Post details',
          content: {
            'application/json': {
              schema: z
                .object({
                  post: PostDetail,
                })
                .meta({ id: 'GetPostResponse' }),
            },
          },
        },
        '404': { description: 'Post not found' },
      },
    },
    delete: {
      operationId: 'deletePost',
      tags: ['Posts'],
      summary: 'Delete a post',
      description: 'Delete a post owned by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Post deleted',
          content: {
            'application/json': {
              schema: z
                .object({
                  message: z.string(),
                  data: z.object({
                    id: z.string(),
                    deletedAt: z
                      .string()
                      .meta({ description: 'ISO 8601 timestamp' }),
                  }),
                })
                .meta({ id: 'DeletePostResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Post not found' },
      },
    },
  },

  '/api/posts/{id}/like': {
    post: {
      operationId: 'likePost',
      tags: ['Posts'],
      summary: 'Like a post',
      description: 'Adds a like to the specified post.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Like result',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  id: z.string(),
                  postId: z.string(),
                  likeCount: z.number(),
                  isLiked: z.literal(true),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Post not found' },
      },
    },
    delete: {
      operationId: 'unlikePost',
      tags: ['Posts'],
      summary: 'Unlike a post',
      description: 'Removes a like from the specified post.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Unlike result',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  postId: z.string(),
                  likeCount: z.number(),
                  isLiked: z.literal(false),
                  message: z.string(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Post not found' },
      },
    },
  },

  '/api/posts/{id}/reply': {
    post: {
      operationId: 'replyToPost',
      tags: ['Posts'],
      summary: 'Reply to a post',
      description: 'Creates a comment reply to the specified post.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              content: z.string().meta({ description: 'Reply content' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created reply',
          content: {
            'application/json': {
              schema: z
                .object({
                  id: z.string(),
                  content: z.string(),
                  postId: z.string(),
                  authorId: z.string(),
                  createdAt: z
                    .string()
                    .meta({ description: 'ISO 8601 timestamp' }),
                  author: CommentAuthor,
                  likeCount: z.number(),
                  replyCount: z.number(),
                })
                .meta({ id: 'PostReplyResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Post not found' },
      },
    },
  },

  '/api/posts/{id}/share': {
    post: {
      operationId: 'sharePost',
      tags: ['Posts'],
      summary: 'Share or quote a post',
      description: 'Reposts or quote-posts the specified post.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Post ID to share' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              isQuote: z
                .boolean()
                .optional()
                .meta({ description: 'Whether this is a quote post' }),
              quoteComment: z
                .string()
                .optional()
                .meta({ description: 'Comment to attach to the quote' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Share result',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  repost: z.object({
                    id: z.string(),
                    originalPostId: z.string(),
                    authorId: z.string(),
                    createdAt: z
                      .string()
                      .meta({ description: 'ISO 8601 timestamp' }),
                  }),
                })
                .meta({ id: 'SharePostResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Post not found' },
      },
    },
  },

  '/api/notifications': {
    get: {
      operationId: 'listNotifications',
      tags: ['Notifications'],
      summary: 'List notifications',
      description:
        "Returns the authenticated user's notifications with optional filtering.",
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Maximum number of notifications' }),
          unreadOnly: z.string().optional().meta({
            description: 'Only return unread notifications (true/false)',
          }),
          type: z
            .string()
            .optional()
            .meta({ description: 'Filter by notification type' }),
        }),
      },
      responses: {
        '200': {
          description: 'Notification list',
          content: {
            'application/json': {
              schema: z
                .object({
                  notifications: z.array(Notification),
                  unreadCount: z.number(),
                })
                .meta({ id: 'ListNotificationsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/notifications/mark-read': {
    post: {
      operationId: 'markNotificationsRead',
      tags: ['Notifications'],
      summary: 'Mark notifications as read',
      description: 'Marks specific notifications or all notifications as read.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              notificationIds: z.array(z.string()).optional().meta({
                description: 'Specific notification IDs to mark read',
              }),
              markAll: z
                .boolean()
                .optional()
                .meta({ description: 'Mark all notifications as read' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Marked as read',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  message: z.string(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/groups': {
    get: {
      operationId: 'listGroups',
      tags: ['Groups'],
      summary: 'List user groups',
      description: 'Returns all groups the authenticated user belongs to.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Group list',
          content: {
            'application/json': {
              schema: z
                .object({
                  groups: z.array(Group),
                })
                .meta({ id: 'ListGroupsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'createGroup',
      tags: ['Groups'],
      summary: 'Create a group',
      description: 'Creates a new group with the authenticated user as owner.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().meta({ description: 'Group name' }),
              memberIds: z
                .array(z.string())
                .optional()
                .meta({ description: 'User IDs to invite' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created group',
          content: {
            'application/json': {
              schema: z.object({
                group: Group,
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/groups/{groupId}': {
    get: {
      operationId: 'getGroupById',
      tags: ['Groups'],
      summary: 'Get group details',
      description:
        "Returns group details including members and the caller's role.",
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          groupId: z.string().meta({ description: 'Group ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Group details',
          content: {
            'application/json': {
              schema: z
                .object({
                  group: GroupDetail,
                })
                .meta({ id: 'GetGroupResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Group not found' },
      },
    },
  },

  '/api/groups/invites': {
    get: {
      operationId: 'listGroupInvites',
      tags: ['Groups'],
      summary: 'List group invites',
      description: 'Returns pending group invites for the authenticated user.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Invite list',
          content: {
            'application/json': {
              schema: z
                .object({
                  invites: z.array(GroupInvite),
                })
                .meta({ id: 'ListGroupInvitesResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/groups/invites/{inviteId}/accept': {
    post: {
      operationId: 'acceptGroupInvite',
      tags: ['Groups'],
      summary: 'Accept group invite',
      description:
        'Accepts a pending group invitation and adds the user as a member.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: inviteIdPath },
      responses: {
        '200': {
          description: 'Invite accepted',
          content: { 'application/json': { schema: AcceptInviteResponse } },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Invite is not for this user' },
        '404': { description: 'Invite not found' },
      },
    },
  },

  '/api/groups/invites/{inviteId}/decline': {
    post: {
      operationId: 'declineGroupInvite',
      tags: ['Groups'],
      summary: 'Decline group invite',
      description: 'Declines a pending group invitation.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: inviteIdPath },
      responses: {
        '200': {
          description: 'Invite declined',
          content: { 'application/json': { schema: DeclineInviteResponse } },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Invite is not for this user' },
        '404': { description: 'Invite not found' },
      },
    },
  },

  '/api/groups/{groupId}/members': {
    post: {
      operationId: 'addGroupMember',
      tags: ['Groups'],
      summary: 'Add member to group',
      description:
        'Adds a member to the group. Agents/NPCs are added directly; human users receive an invite. Admin only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: groupIdPath },
      requestBody: {
        content: { 'application/json': { schema: AddGroupMemberBody } },
      },
      responses: {
        '200': {
          description: 'Member added or invite sent',
          content: { 'application/json': { schema: AddGroupMemberResponse } },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Only admins can add members' },
        '404': { description: 'Group or user not found' },
      },
    },
    delete: {
      operationId: 'removeGroupMember',
      tags: ['Groups'],
      summary: 'Remove member from group',
      description:
        'Removes a member from the group. Admin only, or member can remove themselves.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: groupIdPath,
        query: z.object({
          userId: z
            .string()
            .meta({ description: 'User ID of the member to remove' }),
        }),
      },
      responses: {
        '200': {
          description: 'Member removed',
          content: {
            'application/json': { schema: RemoveGroupMemberResponse },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Only admins can remove members' },
        '404': { description: 'Member not found' },
      },
    },
  },

  '/api/groups/{groupId}/admins': {
    post: {
      operationId: 'promoteGroupAdmin',
      tags: ['Groups'],
      summary: 'Promote member to admin',
      description:
        'Promotes a group member to admin role. Admin/owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: groupIdPath },
      requestBody: {
        content: { 'application/json': { schema: PromoteAdminBody } },
      },
      responses: {
        '200': {
          description: 'Member promoted to admin',
          content: { 'application/json': { schema: PromoteAdminResponse } },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Only admins can promote members' },
        '400': { description: 'User is already an admin or is the owner' },
      },
    },
    delete: {
      operationId: 'demoteGroupAdmin',
      tags: ['Groups'],
      summary: 'Demote admin to member',
      description:
        'Demotes a group admin back to regular member role. Admin/owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: groupIdPath,
        query: z.object({
          userId: z
            .string()
            .meta({ description: 'User ID of the admin to demote' }),
        }),
      },
      responses: {
        '200': {
          description: 'Admin demoted to member',
          content: { 'application/json': { schema: DemoteAdminResponse } },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Only admins can demote' },
        '400': { description: 'Cannot demote the owner' },
      },
    },
  },
};
