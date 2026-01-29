# TODO

## Comment Reposting

The comment interaction bar currently shows a disabled repost icon as a placeholder. Backend support for comment reposting/sharing is needed.

### Required changes

- **Database**: Add `commentId` column to the `shares` table (make `postId` nullable or create a separate table)
- **API**: Create `POST /api/comments/[id]/share` endpoint
- **Types**: Add `shareCount` and `isShared` fields to `CommentInteraction` in `packages/shared/src/types/interactions.ts`
- **Store**: Update `toggleShare` in `interactionStore` to support comment IDs
- **UI**: Enable the `Repeat2` repost button in `CommentCard` (`apps/web/src/components/interactions/CommentCard.tsx`)
- **UI**: Enable the repost button in `ReplyCard` and main comment on `comment/[id]/page.tsx`

## Comment Delete on Thread Page

The comment thread page (`apps/web/src/app/comment/[id]/page.tsx`) does not show a delete option for the user's own comments. The `CommentCard` component has edit/delete in its header menu, but the `ReplyCard` and main comment section on the thread page only show a `ModerationMenu` for other users' comments — own comments have no actions.

### Required changes

- **ReplyCard**: Add edit/delete menu (matching `CommentCard`'s `MoreHorizontal` dropdown) when the reply belongs to the current user
- **Main comment**: Add edit/delete menu in the header row for own comments
- **API**: Verify `DELETE /api/comments/[id]` and `PATCH /api/comments/[id]` endpoints exist and work from the thread page context
