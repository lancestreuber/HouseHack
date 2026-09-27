import { Link } from "@tanstack/react-router";

import { AddressSearch } from "./map/address-search";
import { dispatchAddressSelect } from "./map/address-select-store";
import { ThemeToggle } from "./theme-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/todos", label: "Todos" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-sm">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} to={to}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <AddressSearch onSelect={dispatchAddressSelect} />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
