"use client";
import { type SubmitHandler, useForm } from "react-hook-form";
// import {
//   SignInButton,
//   SignOutButton,
//   UserButton,
//   auth,
//   useUser,
// } from "@clerk/nextjs";

import { api } from "~/trpc/server";
// import Image from "next/image";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import type { inferRouterOutputs } from "@trpc/server";
// import type { AppRouter } from "~/server/api/root";
// import { type User, currentUser } from "@clerk/nextjs/server";
// import clsx from "clsx";
// type RouterOutput = inferRouterOutputs<AppRouter>;
export default function CreatePost() {
  const { register, handleSubmit } = useForm<{ content: string }>();

  const onSubmit: SubmitHandler<{ content: string }> = async (data) => {
    return await api.post.create.mutate({
      content: data.content,
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
          className="rounded-lg bg-Fm-Moderate-blue p-4 text-Fm-Very-light-gray"
        >
          SEND
        </button>
      </div>
    </form>
  );
}
