import { Button } from "@HouseHack/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@HouseHack/ui/components/dropdown-menu";
import { Skeleton } from "@HouseHack/ui/components/skeleton";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { CircleUser, LogIn } from "lucide-react";

import { authClient } from "@/lib/auth-client";

/** Rail-bottom account control: a labeled sign-in link when signed out
 * (returns to this page afterwards), the account menu otherwise. */
export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const { href } = useLocation();

  if (isPending) {
    return <Skeleton className="my-1 size-9 rounded-lg" />;
  }

  if (!session) {
    return (
      <Link
        to="/login"
        search={{ redirect: href }}
        aria-label="Sign in"
        title="Sign in"
        className="flex w-full flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-brass transition-colors hover:bg-accent/40"
      >
        <LogIn className="size-5" />
        <span className="text-[9px] leading-none font-medium">Sign in</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account"
            title={session.user.name}
            className="h-10 w-full rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-foreground [&_svg]:size-5"
          />
        }
      >
        <CircleUser />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
