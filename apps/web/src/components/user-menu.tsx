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
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleUser } from "lucide-react";

import { authClient } from "@/lib/auth-client";

/** Rail-bottom account icon: sign-in link when signed out, account menu
 * otherwise. */
export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="my-1 size-9 rounded-lg" />;
  }

  if (!session) {
    return (
      <Link
        to="/login"
        aria-label="Sign in"
        title="Sign in"
        className="flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
      >
        <CircleUser className="size-5" />
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
            className="size-10 rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-foreground [&_svg]:size-5"
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
