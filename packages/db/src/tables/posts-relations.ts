import { relations } from 'drizzle-orm';
import { comments } from './comments';
import { feedEvents } from './feed-events';
import { postTags } from './post-tags';
import { posts } from './posts';
import { reactions } from './reactions';
import { shareActions } from './share-actions';
import { shares } from './shares';
import { tags } from './tags';
import { trendingTags } from './trending-tags';
import { users } from './user';

export const postsRelations = relations(posts, ({ one, many }) => ({
  User: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  Post_commentOnPostIdToPost: one(posts, {
    fields: [posts.commentOnPostId],
    references: [posts.id],
    relationName: 'Post_commentOnPostIdToPost',
  }),
  other_Post_commentOnPostIdToPost: many(posts, {
    relationName: 'Post_commentOnPostIdToPost',
  }),
  Post_parentCommentIdToPost: one(posts, {
    fields: [posts.parentCommentId],
    references: [posts.id],
    relationName: 'Post_parentCommentIdToPost',
  }),
  other_Post_parentCommentIdToPost: many(posts, {
    relationName: 'Post_parentCommentIdToPost',
  }),
  Post_originalPostIdToPost: one(posts, {
    fields: [posts.originalPostId],
    references: [posts.id],
    relationName: 'Post_originalPostIdToPost',
  }),
  other_Post_originalPostIdToPost: many(posts, {
    relationName: 'Post_originalPostIdToPost',
  }),
  Comment: many(comments),
  Reaction: many(reactions),
  Share: many(shares),
  PostTag: many(postTags),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: 'CommentToComment',
  }),
  childComments: many(comments, {
    relationName: 'CommentToComment',
  }),
  reactions: many(reactions),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [reactions.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  post: one(posts, {
    fields: [shares.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [shares.userId],
    references: [users.id],
  }),
}));

export const shareActionsRelations = relations(shareActions, ({ one }) => ({
  user: one(users, {
    fields: [shareActions.userId],
    references: [users.id],
  }),
}));

export const feedEventsRelations = relations(feedEvents, ({ one }) => ({
  user: one(users, {
    fields: [feedEvents.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
  trendingTags: many(trendingTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const trendingTagsRelations = relations(trendingTags, ({ one }) => ({
  tag: one(tags, {
    fields: [trendingTags.tagId],
    references: [tags.id],
  }),
}));
