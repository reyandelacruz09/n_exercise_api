import { Request, Response } from "express";
import { customerGroupService, GroupValidationError } from "../services/customerGroupService";
import { formTemplateService } from "../services/formTemplateService";
import { auditLogService } from "../services/auditLogService";

export const getGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await customerGroupService.getGroups();
    res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ message: "Failed to fetch customer groups" });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await customerGroupService.getGroupById(id);

    if (!group) {
      return res.status(404).json({ message: "Customer group not found" });
    }

    const members = await customerGroupService.getMembers(id);
    res.json(members);
  } catch (error) {
    console.error("Get group members error:", error);
    res.status(500).json({ message: "Failed to fetch group members" });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const group = await customerGroupService.create(req.body ?? {});

    await auditLogService.log({
      entity: "group",
      action: "add",
      entity_id: group?.id,
      description: `Created customer group '${group?.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Customer group created successfully",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);

    if (error instanceof GroupValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to create customer group",
    });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const group = await customerGroupService.update(id, req.body ?? {});

    if (!group) {
      return res.status(404).json({ message: "Customer group not found" });
    }

    await auditLogService.log({
      entity: "group",
      action: "update",
      entity_id: id,
      description: `Updated customer group '${group.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Customer group updated successfully",
      group,
    });
  } catch (error) {
    console.error("Update group error:", error);

    if (error instanceof GroupValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to update customer group",
    });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const group = await customerGroupService.remove(id);

    if (!group) {
      return res.status(404).json({ message: "Customer group not found" });
    }

    await auditLogService.log({
      entity: "group",
      action: "delete",
      entity_id: id,
      description: `Deleted customer group '${group.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Customer group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({ message: "Failed to delete customer group" });
  }
};

export const setMembers = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const group = await customerGroupService.getGroupById(id);

    if (!group) {
      return res.status(404).json({ message: "Customer group not found" });
    }

    const customerIds = (req.body ?? {}).customerIds;

    if (!Array.isArray(customerIds)) {
      return res.status(400).json({ message: "customerIds must be an array" });
    }

    await customerGroupService.setMembers(id, customerIds);

    await auditLogService.log({
      entity: "group",
      action: "update",
      entity_id: id,
      description: `Updated members of customer group '${group.name}' (${customerIds.length} total)`,
      user_id: (req as any).user?.id ?? null,
    });

    const members = await customerGroupService.getMembers(id);

    return res.json({
      message: "Customer group members updated successfully",
      members,
    });
  } catch (error) {
    console.error("Set group members error:", error);

    if (error instanceof GroupValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to update customer group members",
    });
  }
};