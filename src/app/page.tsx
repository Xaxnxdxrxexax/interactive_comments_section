import {
  SignInButton,
  SignOutButton,
  UserButton,
  auth,
  useUser,
} from "@clerk/nextjs";

import { api } from "~/trpc/server";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { type User, currentUser } from "@clerk/nextjs/server";
import clsx from "clsx";
import CreatePost from "./_components/CreatePost";
type RouterOutput = inferRouterOutputs<AppRouter>;

dayjs.extend(relativeTime);

export default async function Home() {
  const user = await currentUser();
  const allPosts = await api.post.getAll.query();

  if (!allPosts) return <div>Loading</div>;

  return (
    <main className="space-y-5 bg-Fm-Light-grayish-blue px-4 py-8">
      {user?.id ? <SignOutButton /> : <SignInButton />}
      {user?.id && <UserButton />}
      {user?.id && <CreatePost />}
      {allPosts.map((post) => {
        return <Post key={post.id} post={post} />;
      })}
    </main>
  );
}

type PostType = RouterOutput["post"]["getAll"][number];

async function Post({ post }: { post: PostType }) {
  const user = await currentUser();

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
              !user && "bg-Fm-Light-gray text-Fm-Dark-blue",
            )}
            disabled={!user}
          >
            <Image
              src="/images/icon-reply.svg"
              alt="reply"
              width={20}
              height={20}
            />
            {!user ? "Sign in" : "Reply"}
          </button>
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

async function Reply({ reply }: { reply: PostType["replies"][number] }) {
  const user = await currentUser();
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
      <p>{reply.content}</p>
      <div className="flex">
        <p>+</p>
        <p>{reply.score}</p>
        <p>-</p>
      </div>
      <button
        className={clsx("flex", !user && "bg-Fm-Light-gray text-Fm-Dark-blue")}
        disabled={!user}
      >
        <Image
          src="/images/icon-reply.svg"
          alt="reply"
          width={20}
          height={20}
        />
        {!user ? "Sign in" : "Reply"}
      </button>
    </div>
  );
}
