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
export default function EditReply({
  postId,
  content,
  setIsEditOpen,
}: {
  postId: string;
  content: string;
  setIsEditOpen: (value: boolean) => void;
}) {
  const { register, handleSubmit } = useForm<{ content: string }>();
  const ctx = api.useUtils();
  const { mutate: editReply, isLoading: isEditing } =
    api.reply.editReply.useMutation({
      onSuccess: (e) => {
        void ctx.post.getAll.invalidate();
        toast.success(e.message);
        setIsEditOpen(false);
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });

  const onSubmit: SubmitHandler<{ content: string }> = (data) => {
    editReply({
      content: data.content,
      postId: postId,
    });
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      <textarea
        className="flex-grow border"
        defaultValue={content}
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
          disabled={isEditing}
          className="rounded-lg bg-Fm-Moderate-blue p-4 text-Fm-Very-light-gray"
        >
          UPDATE
        </button>
      </div>
    </form>
  );
}
