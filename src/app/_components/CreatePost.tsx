"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import clsx from "clsx";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
export default function CreatePost() {
  const { register, handleSubmit, resetField } = useForm<{ content: string }>();
  const ctx = api.useUtils();
  const { isSignedIn } = useUser();
  const { mutate, isLoading: isPosting } = api.post.createPost.useMutation({
    onSuccess: () => {
      resetField("content");
      void ctx.post.getAll.invalidate();
      toast.success("Post created");
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      }
    },
  });

  const onSubmit: SubmitHandler<{ content: string }> = (data) => {
    mutate(data);
  };

  return (
    <form
      className="items-top mt-2 flex w-full justify-between rounded-xl border bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative h-11 w-11 shrink-0">
        {isSignedIn ? <UserButton /> : <SignInButton />}
      </div>
      <textarea
        className="mx-3 flex-grow rounded-lg border border-Fm-Light-gray p-2"
        placeholder="Add a comment ..."
        {...register("content", {
          required: true,
        })}
      />
      <button
        type="submit"
        disabled={isPosting || !isSignedIn}
        className={clsx(
          "h-10 w-20 rounded-lg  text-Fm-Very-light-gray md:h-12 md:w-24",
          !isSignedIn
            ? "cursor-not-allowed bg-Fm-Grayish-Blue line-through"
            : "bg-Fm-Moderate-blue",
        )}
      >
        SEND
      </button>
    </form>
  );
}
