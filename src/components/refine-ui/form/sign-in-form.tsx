"use client";

import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLink, useLogin } from "@refinedev/core";
import { GoogleSignInButton } from "./google-sign-in-button";

export const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const Link = useLink();
  const { mutate: login } = useLogin();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    login({ email, password }, { onSettled: () => setLoading(false) });
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

        <div className="space-y-10">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Manage your classroom<br />with confidence.
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Track attendance, assignments, grades, and communicate with students and parents — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Attendance Tracking", desc: "Daily mark & reports" },
              { label: "Gradebook", desc: "GPA & report cards" },
              { label: "Assignments", desc: "Create, submit & grade" },
              { label: "Messaging", desc: "Direct communication" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-primary-foreground/10 p-4">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/40 text-sm">© {new Date().getFullYear()} Academix. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              Academix
            </span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue.</p>
          </div>

          <GoogleSignInButton />

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              New to Academix?
            </span>
          </div>

          <Button asChild variant="outline" className="h-11 w-full text-base">
            <Link to="/register">
              <UserPlus className="h-4 w-4" />
              Create an account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

SignInForm.displayName = "SignInForm";
