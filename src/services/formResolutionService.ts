import db from "../db/database";
import type { FormFieldOption, FormFieldsTable } from "../db/schemas/formFields";
import type { FormTemplateFieldsTable } from "../db/schemas/formTemplates";

export type FormFieldSource = "customer" | "template" | "group";

export type ResolvedFormField = {
  id: number;
  source_type: FormFieldSource;
  label: string;
  field_key: string;
  field_type: string;
  options: FormFieldOption[] | null;
  required: boolean;
  placeholder: string | null;
  sort_order: number;
  active: boolean;
};

const fromCustomerFields = (
  fields: FormFieldsTable[],
  source: FormFieldSource
): ResolvedFormField[] =>
  fields.map((field) => ({
    id: field.id,
    source_type: source,
    label: field.label,
    field_key: field.field_key,
    field_type: field.field_type,
    options: field.options,
    required: field.required,
    placeholder: field.placeholder,
    sort_order: field.sort_order,
    active: field.active,
  }));

const fromTemplateFields = (
  fields: FormTemplateFieldsTable[],
  source: FormFieldSource
): ResolvedFormField[] =>
  fields.map((field) => ({
    id: field.id,
    source_type: source,
    label: field.label,
    field_key: field.field_key,
    field_type: field.field_type,
    options: field.options,
    required: field.required,
    placeholder: field.placeholder,
    sort_order: field.sort_order,
    active: field.active,
  }));

const getActiveTemplateFields = async (templateId: number) => {
  return await db
    .selectFrom("form_template_fields")
    .selectAll()
    .where("template_id", "=", templateId)
    .where("active", "=", true)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
};

/**
 * Resolves the effective custom form for a customer:
 * 1. The customer's own per-customer form ("Customer form only" precedence).
 * 2. Otherwise, a template directly assigned to the customer.
 * 3. Otherwise, the template assigned to a group the customer belongs to.
 * 4. Otherwise an empty form.
 */
export const getEffectiveFormFields = async (
  customerId: number
): Promise<ResolvedFormField[]> => {
  const ownFields = await db
    .selectFrom("form_fields")
    .selectAll()
    .where("customer_id", "=", customerId)
    .where("active", "=", true)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();

  if (ownFields.length > 0) {
    return fromCustomerFields(ownFields, "customer");
  }

  const assignment = await db
    .selectFrom("customer_form_assignments")
    .innerJoin(
      "form_templates",
      "form_templates.id",
      "customer_form_assignments.template_id"
    )
    .select([
      "customer_form_assignments.template_id",
      "form_templates.active",
    ])
    .where("customer_form_assignments.customer_id", "=", customerId)
    .orderBy("customer_form_assignments.created_at", "asc")
    .executeTakeFirst();

  if (assignment && assignment.active) {
    const templateFields = await getActiveTemplateFields(assignment.template_id);
    return fromTemplateFields(templateFields, "template");
  }

  const groups = await db
    .selectFrom("customer_group_members")
    .innerJoin(
      "customer_groups",
      "customer_groups.id",
      "customer_group_members.group_id"
    )
    .select(["customer_groups.id", "customer_groups.active", "customer_groups.template_id"])
    .where("customer_group_members.customer_id", "=", customerId)
    .orderBy("customer_groups.id", "asc")
    .execute();

  for (const group of groups) {
    if (!group.active || group.template_id == null) {
      continue;
    }

    const template = await db
      .selectFrom("form_templates")
      .selectAll()
      .where("id", "=", group.template_id)
      .executeTakeFirst();

    if (!template || !template.active) {
      continue;
    }

    const templateFields = await getActiveTemplateFields(template.id);
    return fromTemplateFields(templateFields, "group");
  }

  return [];
};