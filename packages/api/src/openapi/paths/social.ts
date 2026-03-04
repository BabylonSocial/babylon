import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const CommentAuthor = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

const Comment = z
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

const PostAuthor = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

const PostDetail = z
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

const Notification = z
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

const GroupMember = z.object({
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

const Group = z
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

const GroupDetail = z
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

const GroupInvite = z
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
};
