"use client";

import { useState } from "react";
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

const GENERIC_MESSAGE =
  "If that email is registered, we've sent a link to reset your password.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await neon.auth.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message ?? "Could not send the reset link. Please try again.");
        return;
      }
      setSent(true);
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
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p role="status" className="text-sm text-muted-foreground">
            {GENERIC_MESSAGE}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-sm text-muted-foreground text-center">
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
