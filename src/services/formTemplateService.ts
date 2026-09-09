import db from "../db/database";
import type {
  FormTemplateFieldsTable,
  FormTemplatesTable,
} from "../db/schemas/formTemplates";
import {
  FormFieldValidationError,
  isAllowedFieldType,
  optionsValue,
  slugify,
} from "./formFieldService";

export type TemplateFieldInput = {
  label: string;
  field_key?: string;
  field_type: string;
  options?: { label: string; value: string }[] | null;
  required?: boolean;
  placeholder?: string | null;
  sort_order?: number;
  active?: boolean;
};

const nextSortOrder = async (templateId: number): Promise<number> => {
  const row = await db
    .selectFrom("form_template_fields")
    .select(db.fn.max("sort_order").as("max"))
    .where("template_id", "=", templateId)
    .executeTakeFirst();

  return (Number(row?.max) || 0) + 1;
};

export const formTemplateService = {
  getTemplates: async (): Promise<
    (FormTemplatesTable & { fields: FormTemplateFieldsTable[] })[]
  > => {
    const templates = await db
      .selectFrom("form_templates")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    const result: (FormTemplatesTable & {
      fields: FormTemplateFieldsTable[];
    })[] = [];

    for (const template of templates) {
      const fields = await db
        .selectFrom("form_template_fields")
        .selectAll()
        .where("template_id", "=", template.id)
        .orderBy("sort_order", "asc")
        .orderBy("id", "asc")
        .execute();

      result.push({ ...template, fields });
    }

    return result;
  },

  getTemplateById: async (id: number) => {
    return await db
      .selectFrom("form_templates")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  create: async (input: {
    name: string;
    description?: string | null;
    active?: boolean;
  }): Promise<FormTemplatesTable | undefined> => {
    const name = input.name?.trim();

    if (!name) {
      throw new FormFieldValidationError("Template name is required");
    }

    return await db
      .insertInto("form_templates")
      .values({
        name,
        description: input.description?.trim() || null,
        active: input.active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  },

  update: async (
    id: number,
    input: {
      name?: string;
      description?: string | null;
      active?: boolean;
    }
  ): Promise<FormTemplatesTable | undefined> => {
    const existing = await formTemplateService.getTemplateById(id);

    if (!existing) {
      return undefined;
    }

    const patch: Partial<FormTemplatesTable> = { updated_at: new Date() };

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new FormFieldValidationError("Template name cannot be empty");
      }
      patch.name = input.name.trim();
    }

    if (input.description !== undefined) {
      patch.description = input.description?.trim() || null;
    }

    if (input.active !== undefined) {
      patch.active = input.active;
    }

    return await db
      .updateTable("form_templates")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  },

  remove: async (id: number) => {
    const existing = await formTemplateService.getTemplateById(id);

    if (!existing) {
      return undefined;
    }

    await db.deleteFrom("form_templates").where("id", "=", id).execute();

    return existing;
  },

  getFieldsByTemplateId: async (
    templateId: number
  ): Promise<FormTemplateFieldsTable[]> => {
    return await db
      .selectFrom("form_template_fields")
      .selectAll()
      .where("template_id", "=", templateId)
      .orderBy("sort_order", "asc")
      .orderBy("id", "asc")
      .execute();
  },

  createField: async (
    templateId: number,
    input: TemplateFieldInput
  ): Promise<FormTemplateFieldsTable | undefined> => {
    if (!input.label || !input.label.trim()) {
      throw new FormFieldValidationError("Label is required");
    }

    const fieldType = input.field_type;
    if (!isAllowedFieldType(fieldType)) {
      throw new FormFieldValidationError(
        `Invalid field type. Allowed: ${["text", "textarea", "number", "date", "select", "checkbox", "email", "phone"].join(", ")}`
      );
    }

    const fieldKey = input.field_key?.trim() || slugify(input.label);

    const existing = await db
      .selectFrom("form_template_fields")
      .select("id")
      .where("template_id", "=", templateId)
      .where("field_key", "=", fieldKey)
      .executeTakeFirst();

    if (existing) {
      throw new FormFieldValidationError(
        `A field with key '${fieldKey}' already exists in this template`
      );
    }

    const sortOrder = input.sort_order ?? (await nextSortOrder(templateId));

    return await db
      .insertInto("form_template_fields")
      .values({
        template_id: templateId,
        label: input.label.trim(),
        field_key: fieldKey,
        field_type: fieldType,
        options:
          fieldType === "select" ? optionsValue(input.options ?? []) : null,
        required: input.required ?? false,
        placeholder: input.placeholder?.trim() || null,
        sort_order: sortOrder,
        active: input.active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  },

  updateField: async (
    id: number,
    input: Partial<TemplateFieldInput>
  ): Promise<FormTemplateFieldsTable | undefined> => {
    const existing = await db
      .selectFrom("form_template_fields")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!existing) {
      return undefined;
    }

    const patch: {
      label?: string;
      field_key?: string;
      field_type?: string;
      options?: ReturnType<typeof optionsValue>;
      required?: boolean;
      placeholder?: string | null;
      sort_order?: number;
      active?: boolean;
      updated_at?: Date;
    } = { updated_at: new Date() };

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
        .selectFrom("form_template_fields")
        .select("id")
        .where("template_id", "=", existing.template_id)
        .where("field_key", "=", key)
        .where("id", "!=", id)
        .executeTakeFirst();

      if (taken) {
        throw new FormFieldValidationError(
          `A field with key '${key}' already exists in this template`
        );
      }
      patch.field_key = key;
    }

    if (input.field_type !== undefined) {
      if (!isAllowedFieldType(input.field_type)) {
        throw new FormFieldValidationError("Invalid field type");
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

    return await db
      .updateTable("form_template_fields")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  },

  removeField: async (id: number) => {
    const existing = await db
      .selectFrom("form_template_fields")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!existing) {
      return undefined;
    }

    await db
      .deleteFrom("form_template_fields")
      .where("id", "=", id)
      .execute();

    return existing;
  },

  reorderFields: async (
    templateId: number,
    orderedIds: number[]
  ): Promise<void> => {
    const fields = await formTemplateService.getFieldsByTemplateId(templateId);

    if (!Array.isArray(orderedIds) || orderedIds.length !== fields.length) {
      throw new FormFieldValidationError(
        "orderedIds must contain every field id for this template"
      );
    }

    const seen = new Set<number>();

    for (const id of orderedIds) {
      if (seen.has(id)) {
        throw new FormFieldValidationError(
          "orderedIds must not contain duplicates"
        );
      }
      seen.add(id);

      if (!fields.some((f) => f.id === id)) {
        throw new FormFieldValidationError(`Unknown field id '${id}'`);
      }
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .updateTable("form_template_fields")
        .set({ sort_order: i + 1, updated_at: new Date() })
        .where("id", "=", orderedIds[i])
        .execute();
    }
  },
};