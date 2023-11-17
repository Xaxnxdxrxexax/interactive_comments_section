"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import clsx from "clsx";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { useState } from "react";
import { CreateReply, ReadReply } from "./ReplyCRUD";
import LoadingSpinner from "./utils/LoadingSpinner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type PostType = RouterOutput["post"]["getAll"][number];

dayjs.extend(relativeTime);

export function CreatePost() {
  const { register, handleSubmit, resetField } = useForm<{ content: string }>();
  const ctx = api.useUtils();
  const { isSignedIn } = useUser();

  const { mutate: createPost, isLoading: isPosting } =
    api.post.createPost.useMutation({
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
    if (!isSignedIn) return toast.error("Please sign in to post");
    createPost(data);
  };

  return (
    <form
      className="mt-2 flex w-full flex-wrap items-center justify-between rounded-xl border bg-white p-4 md:flex-nowrap md:items-start"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative order-2 flex h-11 w-11 shrink-0 items-center justify-center md:order-1">
        {isSignedIn ? <UserButton /> : <SignInButton />}
      </div>
      <textarea
        className="order-1 mb-3 w-full flex-grow resize-none rounded-lg border border-Fm-Light-gray p-2 md:order-2 md:mx-3 md:mb-0"
        placeholder="Add a comment ..."
        {...register("content", {
          required: true,
        })}
      />
      <button
        type="submit"
        disabled={isPosting || !isSignedIn}
        className={clsx(
          "order-3 flex h-10 w-20 items-center justify-center self-center rounded-lg text-Fm-Very-light-gray md:h-12 md:w-24 md:self-start",
          !isSignedIn
            ? "cursor-not-allowed bg-Fm-Grayish-Blue line-through"
            : "bg-Fm-Moderate-blue",
        )}
      >
        {isPosting ? (
          <div className="aspect-square w-5">
            <LoadingSpinner />
          </div>
        ) : (
          "SEND"
        )}
      </button>
    </form>
  );
}

export function ReadPost({ post }: { post: PostType }) {
  const ctx = api.useUtils();
  const { user } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: votePost, isLoading: isVoting } =
    api.post.votePost.useMutation({
      onSuccess: () => {
        void ctx.post.getAll.invalidate();
      },
      onError: (e) => {
        const message = e.data?.zodError?.fieldErrors.content;
        toast.error(message?.[0] ?? e.message);
      },
    });
  const { mutate: deletePost } = api.post.deletePost.useMutation({
    onSuccess: (e) => {
      void ctx.post.getAll.invalidate();
      toast.success(e.message);
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  function handleVote(postId: string, vote: "1" | "-1") {
    if (!isSignedIn) return toast.error("Please sign in to vote");
    votePost({ postId, vote });
  }
  const { isSignedIn } = useUser();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  return (
    <div key={post.id} className="relative w-full">
      <div className="relative rounded-xl bg-Fm-White p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-8 w-8">
            <Image
              src={post.image}
              alt={`${post.username}'s picture`}
              fill
              className="rounded-full"
            />
          </div>
          <p className="text-sm font-bold">
            {post.username}
            {post.username === user?.username && (
              <span className="ml-2 rounded-sm bg-Fm-Moderate-blue px-[4px] py-[2px] text-xs font-thin text-white">
                you
              </span>
            )}
          </p>
          <p className="text-sm text-Fm-Grayish-Blue">
            {dayjs(post.createdAt).fromNow()}
          </p>
        </div>
        {isEditOpen ? (
          <EditPost
            postId={post.id}
            content={post.content}
            setIsEditOpen={setIsEditOpen}
          />
        ) : (
          <p className="my-4 text-Fm-Dark-blue">{post.content}</p>
        )}
        <div className="flex items-center text-sm">
          <div className="grid h-9 w-24 grid-cols-3 place-items-stretch rounded-xl bg-Fm-Very-light-gray text-Fm-Grayish-Blue">
            <button
              disabled={isVoting}
              onClick={() => handleVote(post.id, "1")}
            >
              +
            </button>
            <p className="place-self-center font-semibold text-Fm-Moderate-blue">
              {post.score}
            </p>
            <button
              disabled={isVoting}
              onClick={() => handleVote(post.id, "-1")}
            >
              -
            </button>
          </div>
          {post.username === user?.username ? (
            <div className="ml-auto flex w-36 items-center justify-around">
              <button
                className="flex items-center gap-2"
                onClick={() => {
                  if (!isSignedIn) {
                    return toast.error("Sign in to delete");
                  }
                  if (post.username !== user?.username) {
                    return toast.error("You can only delete your own posts");
                  }
                  setShowDeleteModal(true);
                }}
              >
                <Image
                  src="/images/icon-delete.svg"
                  alt="delete"
                  width={13}
                  height={13}
                />
                <span className="font-semibold text-Fm-Soft-Red">Delete</span>
              </button>
              <button
                className="flex items-center gap-2"
                onClick={() => {
                  if (!isSignedIn) {
                    return toast.error("Sign in to edit");
                  }
                  if (post.username === user?.username) {
                    setIsEditOpen(true);
                  } else {
                    toast.error("You can only edit your own posts");
                  }
                }}
              >
                <Image
                  src="/images/icon-edit.svg"
                  alt="edit"
                  width={13}
                  height={13}
                />
                <span className="font-semibold text-Fm-Moderate-blue">
                  Edit
                </span>
              </button>
            </div>
          ) : (
            <button
              className={clsx(
                "ml-auto flex items-center justify-center gap-2",
                !isSignedIn && "text-Fm-Dark-blue line-through",
              )}
              onClick={() => {
                if (!isSignedIn) {
                  return toast.error("Please sign in to reply");
                }
                setIsReplyOpen(!isReplyOpen);
              }}
            >
              <Image
                src="/images/icon-reply.svg"
                alt="reply"
                width={13}
                height={13}
              />
              <span
                className={clsx(
                  "font-semibold",
                  isSignedIn
                    ? "text-Fm-Moderate-blue"
                    : "cursor-not-allowed text-Fm-Grayish-Blue line-through",
                )}
              >
                Reply
              </span>
            </button>
          )}
          {showDeleteModal && (
            <div className="fixed left-0 top-0 z-30 grid h-screen w-screen grid-cols-1 place-items-center justify-center bg-Fm-Grayish-Blue/40 px-4">
              <div className="mx-4 w-full max-w-md rounded-lg bg-Fm-Very-light-gray px-7 pb-6 pt-7 text-Fm-Dark-blue">
                <p className="font-bold text-Fm-Dark-blue">Delete comment</p>
                <p className="my-4 text-Fm-Dark-blue">
                  Are you sure you want to delete this comment?
                </p>
                <div className="flex h-12 items-stretch justify-between font-bold text-white">
                  <button
                    className="rounded-lg bg-Fm-Grayish-Blue px-3"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    NO, CANCEL
                  </button>
                  <button
                    className="rounded-lg bg-Fm-Soft-Red px-3"
                    onClick={() => deletePost({ postId: post.id })}
                  >
                    YES, DELETE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isSignedIn && isReplyOpen && (
        <CreateReply
          postIdProp={post.id}
          replyingToProp={post.username}
          setIsReplyingOpen={setIsReplyOpen}
        />
      )}
      <div className="mt-4 space-y-4 border-l border-Fm-Light-gray bg-Fm-Very-light-gray pl-4">
        {post.replies.map((reply) => {
          return <ReadReply key={reply.id} reply={reply} />;
        })}
      </div>
    </div>
  );
}

export function EditPost({
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
      className="mt-2 flex flex-col gap-3 rounded-xl bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <textarea
        className="mx-3 w-full resize-none rounded-lg border border-Fm-Light-gray p-2"
        placeholder="Add a comment ..."
        defaultValue={content}
        {...register("content", {
          required: true,
        })}
      />
      <button
        type="submit"
        disabled={isEditing}
        className="flex h-10 w-20 items-center justify-center self-end rounded-lg bg-Fm-Moderate-blue text-Fm-Very-light-gray md:h-12 md:w-24"
      >
        {isEditing ? (
          <div className="aspect-square w-5">
            <LoadingSpinner />
          </div>
        ) : (
          "SEND"
        )}
      </button>
    </form>
  );
}
