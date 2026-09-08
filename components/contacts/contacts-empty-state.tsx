import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <UsersRound className="size-10 text-muted-foreground" />
      <div>
        <p className="font-medium">No contacts yet</p>
        <p className="text-sm text-muted-foreground">
          Add the first person you want to stay connected with.
        </p>
      </div>
      <Button onClick={onAdd}>Add contact</Button>
    </div>
  );
}
