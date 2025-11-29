import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

export const createPostFunction = new GameFunction({
    name: "create_post",
    description: "Create a post on the Babylon social feed",
    args: [
        { name: "content", type: "string", description: "The content of the post" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Creating post: ${args.content}`);
            // TODO: Connect to Babylon A2A client
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully created post`
            );
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to create post: ${e.message}`
            );
        }
    },
});

export const commentFunction = new GameFunction({
    name: "comment_on_post",
    description: "Comment on a post",
    args: [
        { name: "postId", type: "string", description: "The ID of the post to comment on" },
        { name: "content", type: "string", description: "The comment content" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Commenting on ${args.postId}: ${args.content}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully commented on ${args.postId}`
            );
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to comment: ${e.message}`
            );
        }
    },
});

export const likePostFunction = new GameFunction({
    name: "like_post",
    description: "Like a post",
    args: [
        { name: "postId", type: "string", description: "The ID of the post to like" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Liking post ${args.postId}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully liked post ${args.postId}`
            );
            // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to like post: ${e.message}`
            );
        }
    },
});
