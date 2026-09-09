"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { neon } from "@/lib/neon-client";
import { getAuthErrorMessage } from "@/lib/auth-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (linkError || !token) {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>Link invalid or expired</CardTitle>
          <CardDescription>
            This password reset link is no longer valid. Request a new one to
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            className="w-full"
            render={<Link href="/forgot-password" />}
          >
            Request a new link
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await neon.auth.resetPassword({ newPassword, token: token! });
      if (error) {
        setError(error.message ?? "Could not reset your password.");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(
        getAuthErrorMessage(
          err,
          "Could not reach the authentication service. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-sm text-muted-foreground">
              Your password has been reset.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving..." : "Reset password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
