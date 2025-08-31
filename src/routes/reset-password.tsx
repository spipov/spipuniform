import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const resetPasswordSearchSchema = v.object({
  token: v.optional(v.string()),
});

export const Route = createFileRoute("/reset-password")(
  {
    component: ResetPasswordPage,
    validateSearch: resetPasswordSearchSchema,
    meta: () => [
      {
        title: "Reset Password",
      },
    ],
  }
);

function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}