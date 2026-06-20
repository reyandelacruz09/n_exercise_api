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