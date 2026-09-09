import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
