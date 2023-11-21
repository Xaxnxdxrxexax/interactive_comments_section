"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { type SubmitHandler, useForm } from "react-hook-form";
import relativeTime from "dayjs/plugin/relativeTime";
import LoadingSpinner from "./utils/LoadingSpinner";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import clsx from "clsx";

dayjs.extend(relativeTime);

type PostProps = {
  id: string;
  content: string;
  createdAt: Date;
  score: number;
  username: string;
  image: string;
  votedBy: string[];
  replies?: PostProps[];
  replyingTo?: string;
  postId?: string;
};
export function CreatePost({
  postIdProp,
  replyingToProp,
  setIsReplyingOpen,
}: {
  postIdProp?: string;
  replyingToProp?: string;
  setIsReplyingOpen?: (value: boolean) => void;
}) {
  const { register, handleSubmit, resetField, setFocus } = useForm<{
    content: string;
  }>();
  const { isSignedIn } = useUser();
  const ctx = api.useUtils();

  useEffect(() => {
    setFocus("content");
  }, [setFocus]);
  {
    /* Create post logic */
  }

  const { mutate: createPost, isLoading: isPosting } =
    api.post.createPost.useMutation({
      onSuccess: () => {
        resetField("content");
        void ctx.post.getAll.invalidate();
        toast.success("Post created");
        if (setIsReplyingOpen) setIsReplyingOpen(false);
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage?.[0]) {
          toast.error(errorMessage[0]);
        }
      },
    });

  const onSubmit: SubmitHandler<{
    content: string;
    replyingTo?: string;
    postId?: string;
  }> = (data) => {
    if (!isSignedIn) return toast.error("Please sign in to post");
    if (replyingToProp && postIdProp) {
      createPost({
        content: data.content,
        postId: postIdProp,
        replyingTo: replyingToProp,
      });
    } else {
      createPost({ content: data.content });
    }
  };

  return (
    <form
      className="mt-2 flex w-full flex-wrap items-center justify-between rounded-xl border bg-white p-4 md:flex-nowrap md:items-start"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative order-2 flex h-11 w-11 shrink-0 basis-20 items-center justify-center md:order-1">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <div className="rounded-md bg-Fm-Moderate-blue p-4 text-sm text-white">
            <SignInButton />
          </div>
        )}
      </div>
      <textarea
        className={clsx(
          "order-1 mb-3 w-full flex-grow resize-none rounded-lg border border-Fm-Light-gray p-2 md:order-2 md:mx-3 md:mb-0",
          isPosting ? "cursor-wait" : "",
          !isSignedIn ? "cursor-not-allowed" : "",
        )}
        placeholder="Add a comment ..."
        disabled={isPosting || !isSignedIn}
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
          isPosting ? "cursor-wait" : "",
        )}
      >
        {isPosting ? (
          <div className="aspect-square w-5 cursor-wait">
            <LoadingSpinner />
          </div>
        ) : (
          "SEND"
        )}
      </button>
    </form>
  );
}

export function ReadPost({ post }: { post: PostProps }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const ctx = api.useUtils();

  {
    /* Voting logic */
  }

  const votePostOrReply = post.replyingTo
    ? api.reply.voteReply.useMutation
    : api.post.votePost.useMutation;

  const { mutate: votePost, isLoading: isVoting } = votePostOrReply({
    onSuccess: () => {
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const message = e.data?.zodError?.fieldErrors.content;
      toast.error(message?.[0] ?? e.message);
    },
  });
  const hasTheUserVoted = post.votedBy.includes(user?.id ?? "");

  function handleVote(postId: string, vote: "1" | "-1") {
    if (!isSignedIn) return toast.error("Please sign in to vote");
    votePost({ postId, vote });
  }

  {
    /* Delete logic */
  }

  const deletePostOrReply = post.replyingTo
    ? api.reply.deleteReply.useMutation
    : api.post.deletePost.useMutation;

  const { mutate: deletePost, isLoading: isDeleting } = deletePostOrReply({
    onSuccess: (e) => {
      void ctx.post.getAll.invalidate();
      toast.success(e.message);
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  return (
    <div key={post.id} className="relative w-full">
      <div className="relative rounded-xl bg-Fm-White p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-8 w-8 shrink-0">
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
            replyingTo={post.replyingTo}
            setIsEditOpen={setIsEditOpen}
          />
        ) : (
          <p className="my-4 text-Fm-Dark-blue">
            {post.replyingTo && (
              <span className="mr-2 font-semibold text-Fm-Moderate-blue">
                @{post.replyingTo}
              </span>
            )}
            {post.content}
          </p>
        )}
        <div className="flex items-center text-sm">
          <div
            className={clsx(
              "grid h-9 w-24 grid-cols-3 place-items-stretch rounded-xl text-Fm-Grayish-Blue",
              hasTheUserVoted
                ? "cursor-not-allowed bg-Fm-Moderate-blue text-white"
                : "bg-Fm-Very-light-gray text-Fm-Moderate-blue ",
            )}
          >
            <button
              className={clsx(
                hasTheUserVoted || !isSignedIn ? "cursor-not-allowed" : "",
                isVoting ? "cursor-wait" : "",
              )}
              onClick={() => handleVote(post.id, "1")}
              disabled={isVoting}
            >
              +
            </button>
            <p className="place-self-center font-semibold ">{post.score}</p>
            <button
              className={clsx(
                hasTheUserVoted || !isSignedIn ? "cursor-not-allowed" : "",
                isVoting ? "cursor-wait" : "",
              )}
              onClick={() => handleVote(post.id, "-1")}
              disabled={isVoting}
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
                {isReplyOpen ? "Close" : "Reply"}
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
                    className={clsx(
                      "rounded-lg bg-Fm-Grayish-Blue px-3",
                      isDeleting ? "cursor-wait" : "",
                    )}
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                  >
                    NO, CANCEL
                  </button>
                  <button
                    className={clsx(
                      "rounded-lg bg-Fm-Soft-Red px-3",
                      isDeleting ? "cursor-wait" : "",
                    )}
                    onClick={() => deletePost({ postId: post.id })}
                    disabled={isDeleting}
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
        <CreatePost
          postIdProp={post.id}
          replyingToProp={post.username}
          setIsReplyingOpen={setIsReplyOpen}
        />
      )}
      {post.replies && (
        <div className="mt-4 space-y-4 border-l border-Fm-Light-gray bg-Fm-Very-light-gray pl-4">
          {post.replies.map((reply) => {
            return <ReadPost key={reply.id} post={reply} />;
          })}
        </div>
      )}
    </div>
  );
}

export function EditPost({
  postId,
  content,
  replyingTo,
  setIsEditOpen,
}: {
  postId: string;
  content: string;
  replyingTo?: string;
  setIsEditOpen: (value: boolean) => void;
}) {
  const { register, handleSubmit } = useForm<{ content: string }>();
  const ctx = api.useUtils();

  {
    /* Editing logic */
  }

  const isPostOrReplyEditing = replyingTo
    ? api.reply.editReply.useMutation
    : api.post.editPost.useMutation;

  const { mutate: editPost, isLoading: isEditing } = isPostOrReplyEditing({
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
        className={clsx(
          "flex h-10 w-20 items-center justify-center self-end rounded-lg bg-Fm-Moderate-blue text-Fm-Very-light-gray md:h-12 md:w-24",
          isEditing ? "cursor-wait" : "",
        )}
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
