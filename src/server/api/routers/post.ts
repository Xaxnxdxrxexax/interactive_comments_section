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
});
