"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
export default function EditPost({
  postId,
  content,
  setIsEditOpen,
}: {
  postId: string;
  content: string;
  setIsEditOpen: (value: boolean) => void;
}) {
  const { register, handleSubmit } = useForm<{ content: string }>();
  const { user } = useUser();
  const ctx = api.useUtils();
  const { mutate: editPost, isLoading: isEditing } =
    api.post.editPost.useMutation({
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
    editPost({
      content: data.content,
      postId: postId,
    });
  };

  return (
    <form
      className="items-top mt-2 flex justify-between rounded-xl border bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <textarea
        className="mx-3 flex-grow rounded-lg border border-Fm-Grayish-Blue p-2"
        placeholder="Add a comment ..."
        defaultValue={content}
        {...register("content", {
          required: true,
        })}
      />
      <button
        type="submit"
        disabled={isEditing}
        className="h-10 w-20 rounded-lg bg-Fm-Moderate-blue text-Fm-Very-light-gray md:h-12 md:w-24"
      >
        UPDATE
      </button>
    </form>
  );
}
