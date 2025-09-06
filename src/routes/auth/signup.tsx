import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth/register-form";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
  meta: () => [
    { title: "Sign Up" },
  ],
});

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <RegisterForm />
      </div>
    </div>
  );
}

