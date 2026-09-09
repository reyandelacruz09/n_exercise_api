import { Request, Response } from "express";
import * as productService from "../services/productService";
import { auditLogService } from "../services/auditLogService";

export const getProducts = async (
  req: Request,
  res: Response
) => {
  const products = await productService.getProducts();
  res.json(products);
};

export const getProductById = async (
  req: Request,
  res: Response
) => {
  const product = await productService.getProductById(
    Number(req.params.id)
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  res.json(product);
};

export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, price, stock, cost_price, reorder_level, is_active } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: "Name, price, and stock are required",
      });
    }

    const product = await productService.createProduct(
      name,
      Number(price),
      Number(stock),
      cost_price !== undefined ? Number(cost_price) : null,
      reorder_level !== undefined ? Number(reorder_level) : null,
      is_active !== undefined ? Boolean(is_active) : true
    );

    await auditLogService.log({
      entity: "product",
      action: "add",
      entity_id: product?.id,
      description: `Created product '${product?.name ?? name}' priced at ${product?.price ?? price}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      message: "Failed to create product",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { name, price, stock, cost_price, reorder_level, is_active } = req.body;

    if (
      !name &&
      price === undefined &&
      stock === undefined &&
      cost_price === undefined &&
      reorder_level === undefined &&
      is_active === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required",
      });
    }

    const existing = await productService.getProductById(Number(id));

    if (!existing) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = await productService.updateProduct(Number(id), {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(cost_price !== undefined && { cost_price: Number(cost_price) }),
      ...(reorder_level !== undefined && { reorder_level: Number(reorder_level) }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
    });

    await auditLogService.log({
      entity: "product",
      action: "update",
      entity_id: product?.id,
      description: `Updated product '${product?.name ?? id}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const existing = await productService.getProductById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await productService.deleteProduct(id);

    await auditLogService.log({
      entity: "product",
      action: "delete",
      entity_id: id,
      description: `Deleted product '${existing.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
};