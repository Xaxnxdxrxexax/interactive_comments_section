"use client";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
// import {
//   SignInButton,
//   SignOutButton,
//   UserButton,
//   auth,
//   useUser,
// } from "@clerk/nextjs";

// import Image from "next/image";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import type { inferRouterOutputs } from "@trpc/server";
// import type { AppRouter } from "~/server/api/root";
// import { type User, currentUser } from "@clerk/nextjs/server";
// import clsx from "clsx";
// type RouterOutput = inferRouterOutputs<AppRouter>;
export default function CreateReply({
  postIdProp,
  replyingToProp,
}: {
  postIdProp: string;
  replyingToProp: string;
}) {
  const { register, handleSubmit, resetField } = useForm<{ content: string }>();
  const ctx = api.useUtils();
  const { mutate, isLoading: isPosting } = api.reply.createReply.useMutation({
    onSuccess: () => {
      resetField("content");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      }
    },
  });

  const onSubmit: SubmitHandler<{ content: string }> = (data) => {
    mutate({
      content: data.content,
      postId: postIdProp,
      replyingTo: replyingToProp,
    });
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      <textarea
        className="flex-grow border"
        placeholder="Add a comment"
        {...register("content", {
          required: true,
        })}
      />
      <div className="flex items-center justify-around">
        <div className="relative h-12 w-12">
          {/* <Image
             src={user!.imageUrl}
             alt={`${user!.username}'s picture`}
             fill
           /> */}
        </div>
        <button
          type="submit"
          disabled={isPosting}
          className="rounded-lg bg-Fm-Moderate-blue p-4 text-Fm-Very-light-gray"
        >
          SEND
        </button>
      </div>
    </form>
  );
}
