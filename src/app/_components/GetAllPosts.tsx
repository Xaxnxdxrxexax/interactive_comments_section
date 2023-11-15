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
type RouterOutput = inferRouterOutputs<AppRouter>;

dayjs.extend(relativeTime);

export default function GetAllPosts() {
  const { isSignedIn } = useUser();

  const { data, isLoading } = api.post.getAll.useQuery();

  if (!data) return <p>Loading...</p>;
  if (isLoading) return <p>Loading...</p>;
  return (
    <main className="bg-Fm-Light-asyncgrayish-blue space-y-5 px-4 py-8">
      {isSignedIn ? <SignOutButton /> : <SignInButton />}
      {isSignedIn && <UserButton />}
      {isSignedIn && <CreatePost />}
      {data.map((post) => {
        return <Post key={post.id} post={post} />;
      })}
    </main>
  );
}

type PostType = RouterOutput["post"]["getAll"][number];

function Post({ post }: { post: PostType }) {
  const { isSignedIn } = useUser();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  return (
    <div key={post.id} className="relative p-4">
      <div className="relative bg-Fm-White">
        <div className="flex gap-4">
          <div>
            <Image
              src={post.image}
              alt={`${post.username}'s picture`}
              width={20}
              height={20}
            />
          </div>
          <p>{post.username}</p>
          <p>{dayjs(post.createdAt).fromNow()}</p>
        </div>
        <p>{post.content}</p>
        <div className="flex items-center justify-around">
          <div className="flex">
            <p>+</p>
            <p>{post.score}</p>
            <p>-</p>
          </div>
          <button
            className={clsx(
              "flex",
              !isSignedIn && "bg-Fm-Light-gray text-Fm-Dark-blue",
            )}
            disabled={!isSignedIn}
            onClick={() => setIsReplyOpen(!isReplyOpen)}
          >
            <Image
              src="/images/icon-reply.svg"
              alt="reply"
              width={20}
              height={20}
            />
            {!isSignedIn ? "Sign in" : "Reply"}
          </button>
          {isSignedIn && isReplyOpen && (
            <CreateReply postIdProp={post.id} replyingToProp={post.username} />
          )}
        </div>
      </div>
      <div className="ml-4 mt-4 flex flex-col gap-4 border-l border-black bg-transparent pl-4">
        {post.replies.map((reply) => {
          return <Reply key={reply.id} reply={reply} />;
        })}
      </div>
      {/* The reply component */}
    </div>
  );
}

function Reply({ reply }: { reply: PostType["replies"][number] }) {
  const { isSignedIn } = useUser();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  return (
    <div key={reply.id} className="relative bg-Fm-White p-4">
      <div className="flex gap-4">
        <div>
          <Image
            src={reply.image}
            alt={`${reply.username}'s picture`}
            width={20}
            height={20}
          />
        </div>
        <p>{reply.username}</p>
        <p>{dayjs(reply.createdAt).fromNow()}</p>
      </div>
      <p>
        <span className="pr-2 font-bold">@{reply.replyingTo}</span>
        {reply.content}
      </p>
      <div className="flex">
        <p>+</p>
        <p>{reply.score}</p>
        <p>-</p>
      </div>
      <button
        className={clsx(
          "flex",
          !isSignedIn && "bg-Fm-Light-gray text-Fm-Dark-blue",
        )}
        disabled={!isSignedIn}
        onClick={() => setIsReplyOpen(!isReplyOpen)}
      >
        <Image
          src="/images/icon-reply.svg"
          alt="reply"
          width={20}
          height={20}
        />
        {!isSignedIn ? "Sign in" : "Reply"}
      </button>
      {isSignedIn && isReplyOpen && (
        <CreateReply
          postIdProp={reply.postId}
          replyingToProp={reply.username}
        />
      )}
    </div>
  );
}
