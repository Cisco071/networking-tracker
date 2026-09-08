"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { neon } from "@/lib/neon-client";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * UX-only gate: hides the contacts UI from signed-out visitors and redirects
 * them to /login. This is NOT the security boundary -- Postgres Row Level
 * Security (see sql/schema.sql) is what actually prevents cross-user data
 * access, even against direct Data API requests that bypass this component.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data, isPending } = neon.auth.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.replace("/login");
    }
  }, [isPending, data, router]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6 flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!data?.user) {
    return null;
  }

  return <>{children}</>;
}
