"use client";
import { useUser } from "@clerk/nextjs";

import Image from "next/image";
import dayjs from "dayjs";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import clsx from "clsx";

import { api } from "~/trpc/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { type SubmitHandler, useForm } from "react-hook-form";
import LoadingSpinner from "./utils/LoadingSpinner";
type RouterOutput = inferRouterOutputs<AppRouter>;
type PostType = RouterOutput["post"]["getAll"][number];

export function CreateReply({
  postIdProp,
  replyingToProp,
  setIsReplyingOpen,
}: {
  postIdProp: string;
  replyingToProp: string;
  setIsReplyingOpen: (value: boolean) => void;
}) {
  const { register, handleSubmit, resetField } = useForm<{
    content: string;
  }>();
  const ctx = api.useUtils();
  const { user } = useUser();
  const { mutate: replyPost, isLoading: isReplying } =
    api.reply.createReply.useMutation({
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
    replyPost({
      content: data.content,
      postId: postIdProp,
      replyingTo: replyingToProp,
    });
  };

  return (
    <form
      className="mt-2 flex w-full flex-wrap items-center justify-between rounded-xl border bg-white p-4 md:flex-nowrap md:items-start"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative order-2 flex h-11 w-11 shrink-0 items-center justify-center md:order-1">
        <Image
          fill
          src={user?.imageUrl ?? ""}
          className="rounded-full"
          alt={`${user?.firstName} image`}
        />
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
        disabled={isReplying}
        className={clsx(
          "order-3 flex h-10 w-20 items-center justify-center self-center rounded-lg bg-Fm-Moderate-blue text-Fm-Very-light-gray md:h-12 md:w-24 md:self-start",
        )}
      >
        {isReplying ? (
          <div className="aspect-square w-5">
            <LoadingSpinner />
          </div>
        ) : (
          "REPLY"
        )}
      </button>
    </form>
  );
}

export function ReadReply({ reply }: { reply: PostType["replies"][number] }) {
  const { isSignedIn, user } = useUser();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ctx = api.useUtils();
  const { mutate, isLoading: isVoting } = api.reply.voteReply.useMutation({
    onSuccess: () => {
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
  const { mutate: deleteReply } = api.reply.deleteReply.useMutation({
    onSuccess: () => {
      void ctx.post.getAll.invalidate();
      toast.success("Reply deleted");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
  function handleVote(postId: string, vote: "1" | "-1") {
    if (!isSignedIn) return toast.error("Please sign in to vote");
    mutate({ postId, vote });
  }
  return (
    <div key={reply.id} className="relative">
      <div className="relative rounded-xl  bg-Fm-White p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-8 w-8">
            <Image
              src={reply.image}
              alt={`${reply.username}'s picture`}
              fill
              className="rounded-full"
            />
          </div>
          <p className="text-sm font-bold">
            {reply.username}
            {reply.username === user?.username && (
              <span className="ml-2 rounded-sm bg-Fm-Moderate-blue px-[4px] py-[2px] text-xs font-thin text-white">
                you
              </span>
            )}
          </p>
          <p className="text-sm text-Fm-Grayish-Blue">
            {dayjs(reply.createdAt).fromNow()}
          </p>
        </div>
        {isEditOpen ? (
          <EditReply
            postId={reply.id}
            replyingTo={reply.replyingTo}
            content={reply.content}
            setIsEditOpen={setIsEditOpen}
          />
        ) : (
          <p className="my-4 text-Fm-Dark-blue">
            <span className="mr-2 font-semibold text-Fm-Moderate-blue">
              @{reply.replyingTo}
            </span>
            {reply.content}
          </p>
        )}
        {/* the vote buttons and the reply/edit/delete */}
        <div className="flex items-center text-sm">
          <div className="grid h-9 w-24 grid-cols-3 place-items-stretch rounded-xl bg-Fm-Very-light-gray text-Fm-Grayish-Blue">
            <button
              disabled={isVoting}
              onClick={() => handleVote(reply.id, "1")}
            >
              +
            </button>
            <p className="place-self-center font-semibold text-Fm-Moderate-blue">
              {reply.score}
            </p>
            <button
              disabled={isVoting}
              onClick={() => handleVote(reply.id, "-1")}
            >
              -
            </button>
          </div>
          {reply.username === user?.username ? (
            <div className="ml-auto flex w-36 items-center justify-around">
              <button
                className="flex items-center gap-2"
                onClick={() => {
                  if (!isSignedIn) {
                    return toast.error("Sign in to delete");
                  }
                  if (reply.username !== user?.username) {
                    return toast.error("You can only delete your own replies");
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
                  if (reply.username === user?.username) {
                    setIsEditOpen(true);
                  } else {
                    toast.error("You can only edit your own replys");
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
              className={clsx("ml-auto flex items-center justify-center gap-2")}
              onClick={() => {
                if (!isSignedIn) {
                  return toast.error("Pleasae sign in to reply");
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
                    onClick={() => deleteReply({ postId: reply.id })}
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
        <div className="mt-3">
          <CreateReply
            postIdProp={reply.postId}
            replyingToProp={reply.username}
            setIsReplyingOpen={setIsReplyOpen}
          />
        </div>
      )}
    </div>
  );
}

export function EditReply({
  postId,
  content,
  setIsEditOpen,
}: {
  postId: string;
  content: string;
  replyingTo: string;
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
    <form
      className="mt-2 flex flex-col gap-3 rounded-xl bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <textarea
        className="mx-3 w-full resize-none rounded-lg border border-Fm-Light-gray p-2"
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
          "UPDATE"
        )}
      </button>
    </form>
  );
}
