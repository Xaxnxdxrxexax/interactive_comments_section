import Link from "next/link";
import { SignInButton, SignOutButton, UserButton, auth } from "@clerk/nextjs";

import { api } from "~/trpc/server";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { type User, currentUser } from "@clerk/nextjs/server";
type RouterOutput = inferRouterOutputs<AppRouter>;

dayjs.extend(relativeTime);

export default async function Home() {
  const user = await currentUser();
  const allPosts = await api.post.getAll.query();

  return (
    <main className="bg-Fm-Light-grayish-blue space-y-5 px-4 py-8">
      {user?.id ? <SignOutButton /> : <SignInButton />}
      {user?.id && <UserButton />}
      {user?.id && <CreatePostWizard user={user} />}
      {allPosts.map((post) => {
        return <Post key={post.id} post={post} />;
      })}
    </main>
  );
}

type Post = RouterOutput["post"]["getAll"][number];

function Post({ post }: { post: Post }) {
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
          <button className="flex">
            <Image
              src="/images/icon-reply.svg"
              alt="reply"
              width={20}
              height={20}
            />
            Reply
          </button>
        </div>
        {/* The reply component */}
      </div>
      <div className="ml-4 mt-4 flex flex-col gap-4 border-l border-black bg-transparent pl-4">
        {post.replies.map((reply) => {
          return <Reply key={reply.id} reply={reply} />;
        })}
      </div>
      <div className="flex flex-col">
        <textarea className="flex-grow border" placeholder="Add a comment" />
        <div className="flex items-center justify-around">
          <div className="relative h-12 w-12">
            <Image src={post.image} alt={`${post.username}'s picture`} fill />
          </div>
          <button className="rounded-lg bg-Fm-Moderate-blue p-4 text-Fm-Very-light-gray">
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}

function Reply({ reply }: { reply: Post["replies"][number] }) {
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
      <button className="absolute bottom-4 right-4 flex">
        <Image
          src="/images/icon-reply.svg"
          alt="reply"
          width={20}
          height={20}
        />
        Reply
      </button>
    </div>
  );
}

function CreatePostWizard({ user }: { user: User }) {
  return (
    <div className="border border-black">
      <Image
        src={user.imageUrl}
        alt={`${user.username}'s picture`}
        width={20}
        height={20}
      />
    </div>
  );
}
