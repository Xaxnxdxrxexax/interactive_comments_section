"use client";
import { api } from "~/trpc/react";
import LoadingSpinner from "./utils/LoadingSpinner";
import { CreatePost, ReadPost } from "./PostCRUD";

export default function GetAllPosts() {
  const { data, isLoading } = api.post.getAll.useQuery();

  if (!data || isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10">
          <LoadingSpinner />
        </div>
      </div>
    );

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 bg-Fm-Very-light-gray px-4 py-8">
      {data.map((post) => {
        return <ReadPost key={post.id} post={post} />;
      })}
      <CreatePost />
    </main>
  );
}
