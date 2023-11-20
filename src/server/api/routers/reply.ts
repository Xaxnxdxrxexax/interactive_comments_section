import { currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

export const replyRouter = createTRPCRouter({
  voteReply: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        vote: z.enum(["1", "-1"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      if (!ctx.auth.userId && !user)
        throw new TRPCError({ code: "UNAUTHORIZED" });
      // check if post or reply exists
      const doesReplyExist = await ctx.db.reply.findUnique({
        where: {
          id: input.postId,
        },
      });
      if (!doesReplyExist) throw new TRPCError({ code: "NOT_FOUND" });
      // check if user has already voted
      const hasAlreadyVoted = doesReplyExist.votedBy.includes(ctx.auth.userId);
      // vote
      if (!hasAlreadyVoted) {
        const votedReply = await ctx.db.reply.update({
          where: {
            id: input.postId,
          },
          data: {
            score: { increment: Number(input.vote) },
            votedBy: {
              push: ctx.auth.userId,
            },
          },
        });
        return votedReply;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already voted for this reply",
        });
      }
    }),
  editReply: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z
          .string()
          .min(5, { message: "Content is too short" })
          .max(300, { message: "Content is too long" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      if (!ctx.auth.userId && !user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
      const post = await ctx.db.reply.findUnique({
        where: {
          id: input.postId,
        },
      });
      if (!post)
        throw new TRPCError({ code: "NOT_FOUND", message: "Reply not found" });
      if (post.username !== user?.username)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to edit this reply",
        });
      await ctx.db.reply.update({
        where: {
          id: input.postId,
        },
        data: {
          content: input.content,
        },
      });
      return { message: "Reply updated" };
    }),
  deleteReply: privateProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      if (!ctx.auth.userId && !user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
      const reply = await ctx.db.reply.findUnique({
        where: {
          id: input.postId,
        },
      });
      //check if post exists and is owned by user
      if (!reply)
        throw new TRPCError({ code: "NOT_FOUND", message: "reply not found" });
      if (reply.username !== user?.username)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this reply",
        });
      //delete reply
      await ctx.db.reply.delete({
        where: {
          id: input.postId,
        },
      });
      return { message: "Reply deleted" };
    }),
});
