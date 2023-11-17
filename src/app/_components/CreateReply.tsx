"use client";
import { useUser } from "@clerk/nextjs";
import clsx from "clsx";
import Image from "next/image";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
export default function CreateReply({
  postIdProp,
  replyingToProp,
  setIsReplyingOpen,
}: {
  postIdProp: string;
  replyingToProp: string;
  setIsReplyingOpen: (value: boolean) => void;
}) {
  const { register, handleSubmit, resetField } = useForm<{ content: string }>();
  const ctx = api.useUtils();
  const { user } = useUser();
  const { mutate, isLoading: isPosting } = api.reply.createReply.useMutation({
    onSuccess: () => {
      resetField("content");
      void ctx.post.getAll.invalidate();
      setIsReplyingOpen(false);
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
    <form
      className="items-top mt-2 flex justify-between rounded-xl border bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative h-11 w-11 shrink-0">
        <Image
          fill
          src={user?.imageUrl ?? ""}
          className="rounded-full"
          alt={`${user?.firstName} image`}
        />
      </div>
      <textarea
        className="mx-3 flex-grow rounded-lg border border-Fm-Grayish-Blue p-2"
        placeholder="Add a comment ..."
        {...register("content", {
          required: true,
        })}
      />
      <button
        type="submit"
        disabled={isPosting}
        className="h-10 w-20 rounded-lg bg-Fm-Moderate-blue text-Fm-Very-light-gray md:h-12 md:w-24"
      >
        REPLY
      </button>
    </form>
  );
}
