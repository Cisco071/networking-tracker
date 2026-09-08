"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { neon } from "@/lib/neon-client";
import { AuthGuard } from "@/components/auth/auth-guard";
import { UserMenu } from "@/components/auth/user-menu";
import { ContactsFilterBar } from "@/components/contacts/contacts-filter-bar";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsEmptyState } from "@/components/contacts/contacts-empty-state";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { draftToContactInput, validateContact } from "@/lib/validate-contact";
import type { Contact, ContactDraft } from "@/lib/types";

function friendlyErrorMessage(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("priority")) {
    return "Priority must be high, medium, or low.";
  }
  if (message.includes("name")) {
    return "Name is required.";
  }
  return message;
}

function ContactsView() {
  const { data: session } = neon.auth.useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await neon
        .from("contacts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) {
        setLoadError(error.message);
        return;
      }
      setContacts((data as Contact[]) ?? []);
    } catch {
      setLoadError("Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data fetch on mount: setState inside loadContacts is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts();
  }, [loadContacts]);

  async function handleSave(draft: ContactDraft) {
    const result = validateContact(draftToContactInput(draft));
    if (!result.valid) {
      return { error: Object.values(result.errors)[0] };
    }

    const payload = {
      name: draft.name.trim(),
      company: draft.company.trim() || null,
      role: draft.role.trim() || null,
      where_met: draft.where_met.trim() || null,
      notes: draft.notes.trim() || null,
      priority: draft.priority,
    };

    try {
      if (editingContact) {
        const { error } = await neon
          .from("contacts")
          .update(payload)
          .eq("id", editingContact.id);
        if (error) return { error: friendlyErrorMessage(error.message) };
        toast.success("Contact updated");
      } else {
        if (!session?.user?.id) return { error: "You must be signed in." };
        const { error } = await neon
          .from("contacts")
          .insert([{ ...payload, user_id: session.user.id }]);
        if (error) return { error: friendlyErrorMessage(error.message) };
        toast.success("Contact added");
      }
    } catch {
      return { error: "Could not reach the server. Please try again." };
    }

    await loadContacts();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const { error } = await neon.from("contacts").delete().eq("id", deleteTarget.id);
      if (error) {
        toast.error(friendlyErrorMessage(error.message));
        return;
      }
      toast.success("Contact deleted");
      await loadContacts();
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  }

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      search.trim().length === 0 ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your contacts</h1>
          <p className="text-sm text-muted-foreground">
            People you want to stay connected with at Berkeley.
          </p>
        </div>
        <UserMenu />
      </div>

      <ContactsFilterBar
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onAdd={() => {
          setEditingContact(null);
          setDialogOpen(true);
        }}
      />

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!loading && loadError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load your contacts: {loadError}
        </p>
      )}

      {!loading && !loadError && contacts.length === 0 && (
        <ContactsEmptyState
          onAdd={() => {
            setEditingContact(null);
            setDialogOpen(true);
          }}
        />
      )}

      {!loading && !loadError && contacts.length > 0 && (
        <ContactsTable
          contacts={filtered}
          onEdit={(contact) => {
            setEditingContact(contact);
            setDialogOpen(true);
          }}
          onDelete={(contact) => setDeleteTarget(contact)}
        />
      )}

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editingContact}
        onSave={handleSave}
      />

      <DeleteContactDialog
        contact={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <AuthGuard>
      <ContactsView />
    </AuthGuard>
  );
}
