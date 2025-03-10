import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        ← Back to home
      </Link>

      <div className="flex w-full flex-col items-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full mx-auto max-w-sm",
              card: "bg-background shadow-none border rounded-lg",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90",
              formFieldInput: "bg-background",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-background border text-foreground hover:bg-muted",
              socialButtonsBlockButtonText: "text-foreground font-normal",
              formFieldSuccessText: "text-green-500",
              formFieldErrorText: "text-destructive",
              alertText: "text-destructive",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/90",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />

        <p className="px-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="hover:text-brand underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 