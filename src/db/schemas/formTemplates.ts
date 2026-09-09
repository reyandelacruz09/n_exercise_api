import type { FormFieldOption } from "./formFields";

export interface FormTemplatesTable {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FormTemplateFieldsTable {
  id: number;
  template_id: number;
  label: string;
  field_key: string;
  field_type: string;
  options: FormFieldOption[] | null;
  required: boolean;
  placeholder: string | null;
  sort_order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}