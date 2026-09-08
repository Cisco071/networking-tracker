import { PRIORITIES, type ContactDraft, type Priority } from "./types";

export interface ContactInput {
  name: string;
  company?: string;
  role?: string;
  whereMet?: string;
  notes?: string;
  priority: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<"name" | "priority", string>>;
}

export function validateContact(input: ContactInput): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = "Name is required.";
  }

  if (!PRIORITIES.includes(input.priority as Priority)) {
    errors.priority = "Priority must be high, medium, or low.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function draftToContactInput(draft: ContactDraft): ContactInput {
  return {
    name: draft.name,
    company: draft.company,
    role: draft.role,
    whereMet: draft.where_met,
    notes: draft.notes,
    priority: draft.priority,
  };
}
