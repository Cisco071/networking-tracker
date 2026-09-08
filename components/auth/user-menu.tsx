"use client";

import { useRouter } from "next/navigation";
import { neon } from "@/lib/neon-client";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();
  const { data } = neon.auth.useSession();

  if (!data?.user) return null;

  async function handleSignOut() {
    try {
      await neon.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground truncate max-w-[12rem]">
        {data.user.name || data.user.email}
      </span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
