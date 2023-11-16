import { currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: {
        score: "desc",
      },
      include: {
        replies: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    return posts;
  }),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().min(5).max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      if (!ctx.auth.userId && !user)
        throw new TRPCError({ code: "UNAUTHORIZED" });
      const username = user?.username;
      const image = user?.imageUrl;
      const post = await ctx.db.post.create({
        data: {
          content: input.content,
          image: image!,
          username: username!,
        },
      });
      return post;
    }),
  reply: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        replyingTo: z.string(),
        content: z.string().min(5).max(300),
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
  votePost: privateProcedure
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
      const doesPostExist = await ctx.db.post.findUnique({
        where: {
          id: input.postId,
        },
      });
      if (!doesPostExist) throw new TRPCError({ code: "NOT_FOUND" });
      // check if user has already voted
      // vote
      const votedPost = await ctx.db.post.update({
        where: {
          id: input.postId,
        },
        data: {
          score: { increment: Number(input.vote) },
        },
      });
      return votedPost;
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
      // vote
      const votedReply = await ctx.db.reply.update({
        where: {
          id: input.postId,
        },
        data: {
          score: { increment: Number(input.vote) },
        },
      });
      return votedReply;
    }),
});
