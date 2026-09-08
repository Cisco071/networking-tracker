"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { neon } from "@/lib/neon-client";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data, isPending } = neon.auth.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && data?.user) {
      router.replace("/contacts");
    }
  }, [isPending, data, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="text-3xl font-semibold">Networking Tracker</h1>
        <p className="text-muted-foreground">
          Keep track of the people you want to stay connected with at Berkeley
          &mdash; who they are, where you met, and how important it is to
          follow up.
        </p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/signup" />}>
          Get started
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/login" />}
        >
          Sign in
        </Button>
      </div>
    </main>
  );
}
