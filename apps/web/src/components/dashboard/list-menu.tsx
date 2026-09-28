import { Button } from "@HouseHack/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@HouseHack/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@HouseHack/ui/components/dropdown-menu";
import { Input } from "@HouseHack/ui/components/input";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useListMutations, useLists, useMoveFavorite, useSetNickname } from "@/lib/user-parcels";

// Radio values are strings; "" is the default Favorites list.
const FAVORITES = "";

/** Asks for a list name; used to create and to rename lists. */
export function ListNameDialog({
  open,
  onOpenChange,
  title,
  initial = "",
  submitLabel,
  onSubmit,
  allowEmpty = false,
  label = "List name",
  placeholder = "e.g. Hazelwood scouting",
  maxLength = 60,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  /** Empty submits clear the name (nicknames). */
  allowEmpty?: boolean;
  label?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);
  const submit = () => {
    if (!name.trim() && !allowEmpty) return;
    onSubmit(name.trim());
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input autoFocus value={name} maxLength={maxLength} placeholder={placeholder} onChange={(e) => setName(e.target.value)} aria-label={label} />
        </form>
        <DialogFooter>
          <Button disabled={!name.trim() && !allowEmpty} onClick={submit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The caret beside a favorite's star: nickname it, move it to a list, or start a new list with it. */
export function ListMenu({ pin, zoning, listId, nickname }: { pin: string; zoning: string | null; listId: string | null; nickname: string | null }) {
  const lists = useLists();
  const move = useMoveFavorite();
  const { create } = useListMutations();
  const [naming, setNaming] = useState(false);
  const [nicknaming, setNicknaming] = useState(false);
  const setNickname = useSetNickname();

  const moveTo = (id: string | null) => move.mutate({ pin, zoning, listId: id });
  const createAndMove = (name: string) =>
    create.mutate(
      { name },
      { onSuccess: (list) => moveTo(list.id), onError: (error) => toast.error(error.message) },
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Add to a list"
          title="Add to a list"
          className="rounded p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        >
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Add to list</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={listId ?? FAVORITES} onValueChange={(value) => moveTo(value === FAVORITES ? null : String(value))}>
              <DropdownMenuRadioItem value={FAVORITES}>Favorites</DropdownMenuRadioItem>
              {lists.data?.map((list) => (
                <DropdownMenuRadioItem key={list.id} value={list.id}>
                  {list.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNaming(true)}>
            <Plus /> New list…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNicknaming(true)}>
            <Pencil /> {nickname ? "Rename…" : "Add nickname…"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ListNameDialog open={naming} onOpenChange={setNaming} title="New list" submitLabel="Create and add" onSubmit={createAndMove} />
      <ListNameDialog
        open={nicknaming}
        onOpenChange={setNicknaming}
        title={`Nickname for parcel ${pin}`}
        initial={nickname ?? ""}
        submitLabel="Save"
        allowEmpty
        label="Nickname"
        placeholder="e.g. Corner lot by the library (leave empty to clear)"
        maxLength={80}
        onSubmit={(name) => setNickname.mutate({ pin, nickname: name || null })}
      />
    </>
  );
}
