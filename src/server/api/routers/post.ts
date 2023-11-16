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
  createPost: privateProcedure
    .input(
      z.object({
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
      if (!doesPostExist)
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      // check if user has already voted
      const hasAlreadyVoted = doesPostExist.votedBy.includes(ctx.auth.userId);
      // vote
      if (!hasAlreadyVoted) {
        const votedPost = await ctx.db.post.update({
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
        return votedPost;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already voted for this post",
        });
      }
    }),
});
