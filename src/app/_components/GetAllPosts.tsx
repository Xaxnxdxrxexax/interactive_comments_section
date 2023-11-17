"use client";
import {
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import clsx from "clsx";

import { api } from "~/trpc/react";
import CreatePost from "./CreatePost";
import { useState } from "react";
import CreateReply from "./CreateReply";
import toast from "react-hot-toast";
import EditPost from "./EditPost";
import EditReply from "./EditReply";
type RouterOutput = inferRouterOutputs<AppRouter>;

dayjs.extend(relativeTime);

export default function GetAllPosts() {
  const { isSignedIn } = useUser();

  const { data, isLoading } = api.post.getAll.useQuery();

  if (!data) return <p>Loading...</p>;
  if (isLoading) return <p>Loading...</p>;
  return (
    <main className="flex flex-col items-center justify-center gap-4 bg-Fm-Very-light-gray px-4 py-8">
      {data.map((post) => {
        return <Post key={post.id} post={post} />;
      })}
      <CreatePost />
    </main>
  );
}

type PostType = RouterOutput["post"]["getAll"][number];

function Post({ post }: { post: PostType }) {
  const ctx = api.useUtils();
  const { user } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: voteMutate, isLoading: isVoting } =
    api.post.votePost.useMutation({
      onSuccess: () => {
        void ctx.post.getAll.invalidate();
      },
      onError: (e) => {
        toast.error(e.message);
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
    voteMutate({ postId, vote });
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
        {/* the vote buttons and the reply/edit/delete */}
        <div className="flex items-center text-sm">
          <div className="grid h-9 w-24 grid-cols-3 place-items-center rounded-xl bg-Fm-Very-light-gray text-Fm-Grayish-Blue">
            <button
              disabled={isVoting}
              onClick={() => handleVote(post.id, "1")}
            >
              +
            </button>
            <p className="font-semibold text-Fm-Moderate-blue">{post.score}</p>
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
              disabled={!isSignedIn}
              onClick={() => setIsReplyOpen(!isReplyOpen)}
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
          return <Reply key={reply.id} reply={reply} />;
        })}
      </div>
    </div>
  );
}

function Reply({ reply }: { reply: PostType["replies"][number] }) {
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
          <div className="grid h-9 w-24 grid-cols-3 place-items-center rounded-xl bg-Fm-Very-light-gray text-Fm-Grayish-Blue">
            <button
              disabled={isVoting}
              onClick={() => handleVote(reply.id, "1")}
            >
              +
            </button>
            <p className="font-semibold text-Fm-Moderate-blue">{reply.score}</p>
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
              disabled={!isSignedIn}
              onClick={() => setIsReplyOpen(!isReplyOpen)}
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
