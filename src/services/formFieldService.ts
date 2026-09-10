import db from "../db/database";
import { sql, type RawBuilder } from "kysely";
import type { FormFieldOption, FormFieldsTable } from "../db/schemas/formFields";

export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "email",
  "phone",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const isAllowedFieldType = (type: string): type is FormFieldType => {
  return (FORM_FIELD_TYPES as readonly string[]).includes(type);
};

export type FormFieldInput = {
  label: string;
  field_key?: string;
  field_type: string;
  options?: FormFieldOption[] | null;
  required?: boolean;
  placeholder?: string | null;
  sort_order?: number;
  active?: boolean;
};

export class FormFieldValidationError extends Error {}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "field";

const nextSortOrder = async (customerId: number): Promise<number> => {
  const row = await db
    .selectFrom("form_fields")
    .select(db.fn.max("sort_order").as("max"))
    .where("customer_id", "=", customerId)
    .executeTakeFirst();

  return (Number(row?.max) || 0) + 1;
};

export const optionsValue = (
  options: FormFieldOption[] | null
): RawBuilder<FormFieldOption[]> | null =>
  options && options.length > 0
    ? sql<FormFieldOption[]>`${JSON.stringify(options)}::jsonb`
    : null;

export const formFieldService = {
  getByCustomerId: async (customerId: number): Promise<FormFieldsTable[]> => {
    return await db
      .selectFrom("form_fields")
      .selectAll()
      .where("customer_id", "=", customerId)
      .orderBy("sort_order", "asc")
      .orderBy("id", "asc")
      .execute();
  },

  getActiveByCustomerId: async (customerId: number): Promise<FormFieldsTable[]> => {
    return await db
      .selectFrom("form_fields")
      .selectAll()
      .where("customer_id", "=", customerId)
      .where("active", "=", true)
      .orderBy("sort_order", "asc")
      .orderBy("id", "asc")
      .execute();
  },

  getById: async (id: number): Promise<FormFieldsTable | undefined> => {
    return await db
      .selectFrom("form_fields")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  create: async (
    customerId: number,
    input: FormFieldInput
  ): Promise<FormFieldsTable | undefined> => {
    if (!input.label || !input.label.trim()) {
      throw new FormFieldValidationError("Label is required");
    }

    const fieldType = input.field_type;
    if (!isAllowedFieldType(fieldType)) {
      throw new FormFieldValidationError(
        `Invalid field type. Allowed: ${FORM_FIELD_TYPES.join(", ")}`
      );
    }

    const fieldKey =
      input.field_key?.trim() || slugify(input.label);

    const existing = await db
      .selectFrom("form_fields")
      .select("id")
      .where("customer_id", "=", customerId)
      .where("field_key", "=", fieldKey)
      .executeTakeFirst();

    if (existing) {
      throw new FormFieldValidationError(
        `A field with key '${fieldKey}' already exists for this customer`
      );
    }

    const sortOrder = input.sort_order ?? (await nextSortOrder(customerId));

    return await db
      .insertInto("form_fields")
      .values({
        customer_id: customerId,
        label: input.label.trim(),
        field_key: fieldKey,
        field_type: fieldType,
        options: fieldType === "select" ? optionsValue(input.options ?? []) : null,
        required: input.required ?? false,
        placeholder: input.placeholder?.trim() || null,
        sort_order: sortOrder,
        active: input.active ?? true,
      })
      .returningAll()
      .executeTakeFirst();
  },

  update: async (
    id: number,
    input: Partial<FormFieldInput>
  ): Promise<FormFieldsTable | undefined> => {
    const existing = await formFieldService.getById(id);

    if (!existing) {
      return undefined;
    }

    const patch: {
      label?: string;
      field_key?: string;
      field_type?: string;
      options?: RawBuilder<FormFieldOption[]> | null;
      required?: boolean;
      placeholder?: string | null;
      sort_order?: number;
      active?: boolean;
      updated_at?: Date;
    } = {};

    if (input.label !== undefined) {
      if (!input.label.trim()) {
        throw new FormFieldValidationError("Label cannot be empty");
      }
      patch.label = input.label.trim();
    }

    if (input.field_key !== undefined) {
      const key = input.field_key.trim() || undefined;
      if (!key) {
        throw new FormFieldValidationError("Field key cannot be empty");
      }
      const taken = await db
        .selectFrom("form_fields")
        .select("id")
        .where("customer_id", "=", existing.customer_id)
        .where("field_key", "=", key)
        .where("id", "!=", id)
        .executeTakeFirst();

      if (taken) {
        throw new FormFieldValidationError(
          `A field with key '${key}' already exists for this customer`
        );
      }
      patch.field_key = key;
    }

    if (input.field_type !== undefined) {
      if (!isAllowedFieldType(input.field_type)) {
        throw new FormFieldValidationError(
          `Invalid field type. Allowed: ${FORM_FIELD_TYPES.join(", ")}`
        );
      }
      patch.field_type = input.field_type;
      if (input.field_type !== "select") {
        patch.options = null;
      }
    }

    if (input.options !== undefined) {
      patch.options = optionsValue(input.options);
    }

    if (input.required !== undefined) {
      patch.required = input.required;
    }

    if (input.placeholder !== undefined) {
      patch.placeholder = input.placeholder?.trim() || null;
    }

    if (input.sort_order !== undefined) {
      patch.sort_order = input.sort_order;
    }

    if (input.active !== undefined) {
      patch.active = input.active;
    }

    patch.updated_at = new Date();

    return await db
      .updateTable("form_fields")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  },

  remove: async (id: number): Promise<FormFieldsTable | undefined> => {
    const existing = await formFieldService.getById(id);

    if (!existing) {
      return undefined;
    }

    await db.deleteFrom("form_fields").where("id", "=", id).execute();

    return existing;
  },

  reorder: async (
    customerId: number,
    orderedIds: number[]
  ): Promise<void> => {
    const fields = await formFieldService.getByCustomerId(customerId);
    const idSet = new Set(orderedIds);

    if (!Array.isArray(orderedIds) || orderedIds.length !== fields.length) {
      throw new FormFieldValidationError(
        "orderedIds must contain every field id for this customer"
      );
    }

    for (const id of orderedIds) {
      if (!fields.some((f) => f.id === id)) {
        throw new FormFieldValidationError(`Unknown field id '${id}'`);
      }
    }

    if (idSet.size !== orderedIds.length) {
      throw new FormFieldValidationError("orderedIds must not contain duplicates");
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .updateTable("form_fields")
        .set({ sort_order: i + 1, updated_at: new Date() })
        .where("id", "=", orderedIds[i])
        .execute();
    }
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-().]{6,}$/;

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

export interface FormFieldLike {
  field_key: string;
  field_type: string;
  label: string;
  required: boolean;
  active: boolean;
  options: FormFieldOption[] | null;
}

export const validateCustomFields = (
  fields: FormFieldLike[],
  customFields: unknown
): Record<string, unknown> => {
  if (customFields === undefined || customFields === null) {
    customFields = {};
  }

  if (typeof customFields !== "object" || Array.isArray(customFields)) {
    throw new FormFieldValidationError("custom_fields must be an object");
  }

  const values = customFields as Record<string, unknown>;
  const active = fields.filter((f) => f.active);
  const result: Record<string, unknown> = {};

  for (const field of active) {
    const raw = values[field.field_key];

    if (isEmpty(raw)) {
      if (field.required) {
        throw new FormFieldValidationError(`'${field.label}' is required`);
      }
      continue;
    }

    switch (field.field_type) {
      case "number": {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new FormFieldValidationError(
            `'${field.label}' must be a valid number`
          );
        }
        result[field.field_key] = num;
        break;
      }
      case "checkbox": {
        if (typeof raw === "boolean") {
          result[field.field_key] = raw;
        } else if (raw === "true" || raw === 1) {
          result[field.field_key] = true;
        } else if (raw === "false" || raw === 0) {
          result[field.field_key] = false;
        } else {
          throw new FormFieldValidationError(
            `'${field.label}' must be true or false`
          );
        }
        break;
      }
      case "date": {
        if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
          throw new FormFieldValidationError(
            `'${field.label}' must be a valid date`
          );
        }
        result[field.field_key] = raw;
        break;
      }
      case "email": {
        if (typeof raw !== "string" || !EMAIL_REGEX.test(raw)) {
          throw new FormFieldValidationError(
            `'${field.label}' must be a valid email address`
          );
        }
        result[field.field_key] = raw;
        break;
      }
      case "phone": {
        if (typeof raw !== "string" || !PHONE_REGEX.test(raw)) {
          throw new FormFieldValidationError(
            `'${field.label}' must be a valid phone number`
          );
        }
        result[field.field_key] = raw;
        break;
      }
      case "select": {
        const optionValues = (field.options ?? []).map((o) => o.value);
        if (!optionValues.includes(String(raw))) {
          throw new FormFieldValidationError(
            `'${field.label}' must be one of: ${optionValues.join(", ")}`
          );
        }
        result[field.field_key] = String(raw);
        break;
      }
      case "text":
      case "textarea":
      default: {
        const text = typeof raw === "string" ? raw : String(raw);
        result[field.field_key] = text;
        break;
      }
    }
  }

  return result;
};