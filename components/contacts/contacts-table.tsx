"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/components/contacts/priority-badge";
import type { Contact } from "@/lib/types";

type SortKey = "name" | "company" | "priority" | "updated_at";

const PRIORITY_RANK: Record<Contact["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

function SortButton({
  column,
  onSort,
  children,
}: {
  column: SortKey;
  onSort: (column: SortKey) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(column)}
      className="-ml-2.5 h-auto py-1"
    >
      {children}
      <ArrowUpDown className="ml-1 size-3.5" />
    </Button>
  );
}

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...contacts].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "priority") {
      cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    } else if (sortKey === "updated_at") {
      cmp = a.updated_at.localeCompare(b.updated_at);
    } else {
      cmp = (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton column="name" onSort={toggleSort}>Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="company" onSort={toggleSort}>Company</SortButton>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Where met</TableHead>
              <TableHead>
                <SortButton column="priority" onSort={toggleSort}>Priority</SortButton>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.company || "—"}</TableCell>
                <TableCell>{contact.role || "—"}</TableCell>
                <TableCell>{contact.where_met || "—"}</TableCell>
                <TableCell>
                  <PriorityBadge priority={contact.priority} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(contact)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(contact)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {sorted.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  {(contact.company || contact.role) && (
                    <p className="text-sm text-muted-foreground">
                      {[contact.role, contact.company].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
                <PriorityBadge priority={contact.priority} />
              </div>
              {contact.where_met && (
                <p className="text-sm text-muted-foreground">
                  Met: {contact.where_met}
                </p>
              )}
              {contact.notes && <p className="text-sm">{contact.notes}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(contact)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDelete(contact)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
