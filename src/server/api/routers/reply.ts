import { currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

export const replyRouter = createTRPCRouter({
  createReply: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        replyingTo: z.string(),
        content: z
          .string()
          .min(5, { message: "Content is too short" })
          .max(300, { message: "Content is too long" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      if (!ctx.auth.userId && !user)
        throw new TRPCError({ code: "UNAUTHORIZED" });
      const username = user?.username;
      const image = user?.imageUrl;
      const reply = await ctx.db.reply.create({
        data: {
          content: input.content,
          postId: input.postId,
          replyingTo: input.replyingTo,
          username: username!,
          image: image!,
        },
      });
      return reply;
    }),
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
});
