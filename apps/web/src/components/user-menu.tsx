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
import { LogIn } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button variant="ghost" size="icon" aria-label="Sign In" title="Sign In">
          <LogIn />
        </Button>
      </Link>
    );
  }

  const initial = (session.user.name ?? session.user.email ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={session.user.name}
            className="rounded-full"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent className="bg-popover">
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