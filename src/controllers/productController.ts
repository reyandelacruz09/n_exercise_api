import { Request, Response } from "express";
import * as productService from "../services/productService";

export const getProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const products = await productService.getProducts();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve products",
    });
  }
};