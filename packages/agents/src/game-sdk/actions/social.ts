import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { BabylonRuntime } from "../../plugins/babylon/types";

/**
 * Factory function to create createPostFunction with Babylon runtime
 */
export function createPostFunctionFactory(
    runtime?: BabylonRuntime
    // biome-ignore lint/suspicious/noExplicitAny: GameFunction requires type arg, using any for flexibility
): GameFunction<any> {
    return new GameFunction({
        name: "create_post",
        description: "Create a post on the Babylon social feed",
        args: [
            { name: "content", type: "string", description: "The content of the post" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Creating post: ${args.content}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const result = (await runtime.a2aClient.sendRequest("a2a.createPost", {
                    content: args.content,
                    type: "post",
                })) as { postId?: string };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully created post${result.postId ? ` (ID: ${result.postId})` : ""}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to create post: ${e.message || String(e)}`
                );
            }
        },
    });
}

/**
 * Factory function to create commentFunction with Babylon runtime
 */
export function createCommentFunctionFactory(
    runtime?: BabylonRuntime
    // biome-ignore lint/suspicious/noExplicitAny: GameFunction requires type arg, using any for flexibility
): GameFunction<any> {
    return new GameFunction({
        name: "comment_on_post",
        description: "Comment on a post",
        args: [
            { name: "postId", type: "string", description: "The ID of the post to comment on" },
            { name: "content", type: "string", description: "The comment content" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Commenting on ${args.postId}: ${args.content}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const result = (await runtime.a2aClient.sendRequest("a2a.createComment", {
                    postId: args.postId,
                    content: args.content,
                })) as { commentId?: string };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully commented on ${args.postId}${result.commentId ? ` (Comment ID: ${result.commentId})` : ""}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to comment: ${e.message || String(e)}`
                );
            }
        },
    });
}

/**
 * Factory function to create likePostFunction with Babylon runtime
 */
export function createLikePostFunctionFactory(
    runtime?: BabylonRuntime
    // biome-ignore lint/suspicious/noExplicitAny: GameFunction requires type arg, using any for flexibility
): GameFunction<any> {
    return new GameFunction({
        name: "like_post",
        description: "Like a post",
        args: [
            { name: "postId", type: "string", description: "The ID of the post to like" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Liking post ${args.postId}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                await runtime.a2aClient.sendRequest("a2a.likePost", {
                    postId: args.postId,
                });

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully liked post ${args.postId}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to like post: ${e.message || String(e)}`
                );
            }
        },
    });
}

// Export default instances for backward compatibility (without runtime)
export const createPostFunction = createPostFunctionFactory();
export const commentFunction = createCommentFunctionFactory();
export const likePostFunction = createLikePostFunctionFactory();
