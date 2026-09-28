import { Button } from "@HouseHack/ui/components/button";
import { Input } from "@HouseHack/ui/components/input";
import { Label } from "@HouseHack/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-5 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Welcome back
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Work email
              </Label>
              <Input
                autoComplete="email"
                className="rounded-md bg-background"
                id={field.name}
                name={field.name}
                placeholder="analyst@department.gov"
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-xs text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Password
              </Label>
              <Input
                autoComplete="current-password"
                className="rounded-md bg-background tracking-wider"
                id={field.name}
                name={field.name}
                placeholder="••••••••••••"
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-xs text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              className="mt-1 w-full rounded-lg py-2 font-semibold"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight />
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          className="text-xs tracking-wider text-muted-foreground uppercase hover:text-brass"
          onClick={onSwitchToSignUp}
          variant="link"
        >
          Need an account? Sign Up
        </Button>
      </div>
    </div>
  );
}
