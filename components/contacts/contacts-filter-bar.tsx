"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onAdd: () => void;
}

export function ContactsFilterBar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  onAdd,
}: ContactsFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or company..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:w-64"
        />
        <Select value={priorityFilter} onValueChange={(v) => onPriorityFilterChange(String(v))}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onAdd} className="sm:w-auto w-full">
        Add contact
      </Button>
    </div>
  );
}
