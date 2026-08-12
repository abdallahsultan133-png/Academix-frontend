"use client";

import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLink, useNotification, useRegister } from "@refinedev/core";
import { GoogleSignInButton } from "./google-sign-in-button";

export const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const Link = useLink();
  const { open } = useNotification();
  const { mutate: register } = useRegister();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      open?.({ type: "error", message: "Passwords don't match", description: "Make sure both password fields are identical." });
      return;
    }
    setLoading(true);
    register({ name, email, password }, { onSettled: () => setLoading(false) });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight">Academix</span>
        </div>

        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Your classroom,<br />organised at last.
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Join thousands of teachers and students using Academix to run better, smarter classrooms.
          </p>
          <ul className="space-y-3">
            {[
              "Free to sign up — no credit card needed",
              "Role-based access for teachers, students & parents",
              "Real-time notifications & messaging",
              "Automatic GPA calculation & report cards",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-primary-foreground/40 text-sm">© {new Date().getFullYear()} Academix. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              Academix
            </span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll start as a <strong>student</strong> — an admin can change your role after sign-up.
            </p>
          </div>

          <GoogleSignInButton />

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Mathias Wambura"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              Already have an account?
            </span>
          </div>

          <p className="text-center text-sm">
            <Link to="/login" className={cn("font-semibold text-primary underline-offset-4 hover:underline")}>
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

SignUpForm.displayName = "SignUpForm";
