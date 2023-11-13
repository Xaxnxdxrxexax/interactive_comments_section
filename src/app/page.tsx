import Link from "next/link";
import {
  SignInButton,
  SignOutButton,
  UserButton,
  auth,
  currentUser,
  useUser,
} from "@clerk/nextjs";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/server";

export default async function Home() {
  // const hello = await api.post.hello.query({ text: "from tRPC" });

  // const user = useUser();
  const { userId } = auth();

  const user = await currentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {userId ? <SignOutButton /> : <SignInButton />}
      {userId && user?.username}
    </main>
  );
}

// async function CrudShowcase() {
//   const latestPost = await api.post.getLatest.query();

//   return (
//     <div className="w-full max-w-xs">
//       {latestPost ? (
//         <p className="truncate">Your most recent post: {latestPost.name}</p>
//       ) : (
//         <p>You have no posts yet.</p>
//       )}

//       <CreatePost />
//     </div>
//   );
// }
