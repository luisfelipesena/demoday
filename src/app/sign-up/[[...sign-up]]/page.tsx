import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>

        <SignUp
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
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />

        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="hover:text-brand underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 