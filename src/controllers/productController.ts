import { Request, Response } from "express";
import * as productService from "../services/productService";

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
    const { name, price, stock } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: "Name, price, and stock are required",
      });
    }

    const product = await productService.createProduct(
      name,
      Number(price),
      Number(stock)
    );

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
    const { name, price, stock } = req.body;

    if (!name && price === undefined && stock === undefined) {
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