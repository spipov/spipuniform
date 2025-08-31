import { createFileRoute } from "@tanstack/react-router";
import { SigninForm } from "@/components/auth/signin-form";

export const Route = createFileRoute("/auth/signin")(
  {
    component: SigninPage,
    meta: () => [
      {
        title: "Sign In",
      },
    ],
  }
);

function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <SigninForm />
      </div>
    </div>
  );
}