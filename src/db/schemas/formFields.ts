export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldsTable {
  id: number;
  customer_id: number;
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