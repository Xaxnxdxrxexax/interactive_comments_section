import Link from "next/link";
import { SignInButton, SignOutButton, UserButton, auth } from "@clerk/nextjs";

import { api } from "~/trpc/server";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default async function Home() {
  const { userId } = auth();
  const allComments = await api.post.getAll.query();

  return (
    <main className="bg-Fm-Light-grayish blue mx-4 my-8">
      {/* {userId ? <SignOutButton /> : <SignInButton />}
      {userId && <UserButton />} */}
      {allComments.map((post) => {
        return (
          <div key={post.id} className="relative bg-Fm-White p-4">
            <div className="relative">
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
              <div className="flex">
                <p>+</p>
                <p>{post.score}</p>
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
            <div className="ml-4 border-l border-black pl-4">
              {post.replies?.map((reply) => {
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
              })}
            </div>
          </div>
        );
      })}
    </main>
  );
}
