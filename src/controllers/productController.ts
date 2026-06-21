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