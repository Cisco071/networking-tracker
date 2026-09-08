"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateContact } from "@/lib/validate-contact";
import { EMPTY_CONTACT_DRAFT, type Contact, type ContactDraft } from "@/lib/types";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (draft: ContactDraft) => Promise<{ error?: string } | void>;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  onSave,
}: ContactFormDialogProps) {
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_CONTACT_DRAFT);
  const [errors, setErrors] = useState<{ name?: string; priority?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset the form whenever the dialog opens, for either create or edit mode.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiError(null);
    setErrors({});
    if (contact) {
      setDraft({
        name: contact.name,
        company: contact.company ?? "",
        role: contact.role ?? "",
        where_met: contact.where_met ?? "",
        notes: contact.notes ?? "",
        priority: contact.priority,
      });
    } else {
      setDraft(EMPTY_CONTACT_DRAFT);
    }
  }, [open, contact]);

  function updateField<K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const result = validateContact({
      name: draft.name,
      priority: draft.priority,
    });
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const outcome = await onSave(draft);
    setSubmitting(false);

    if (outcome?.error) {
      setApiError(outcome.error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {contact
              ? "Update this person's details."
              : "Add someone you want to stay connected with."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">Name *</Label>
            <Input
              id="contact-name"
              value={draft.name}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-company">Company</Label>
              <Input
                id="contact-company"
                value={draft.company}
                onChange={(e) => updateField("company", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                value={draft.role}
                onChange={(e) => updateField("role", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-where-met">Where you met</Label>
            <Input
              id="contact-where-met"
              value={draft.where_met}
              onChange={(e) => updateField("where_met", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-priority">Priority *</Label>
            <Select
              value={draft.priority}
              onValueChange={(value) => updateField("priority", String(value))}
            >
              <SelectTrigger id="contact-priority" className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p role="alert" className="text-sm text-destructive">
                {errors.priority}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          {apiError && (
            <p role="alert" className="text-sm text-destructive">
              {apiError}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Saving..." : contact ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
