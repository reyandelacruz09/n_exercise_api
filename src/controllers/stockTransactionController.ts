import { Request, Response } from "express";
import {
  stockTransactionService,
  StockTransactionValidationError,
} from "../services/stockTransactionService";

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { product_id, quantity, type, cost_price, note } = req.body;

    if (
      product_id === undefined ||
      quantity === undefined ||
      !type
    ) {
      return res.status(400).json({
        message: "product_id, quantity, and type are required",
      });
    }

    const result = await stockTransactionService.createTransaction({
      product_id: Number(product_id),
      quantity: Number(quantity),
      type,
      cost_price: cost_price !== undefined ? Number(cost_price) : null,
      note: note ?? null,
      created_by: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Stock transaction created successfully",
      transaction: result,
    });
  } catch (error) {
    console.error("Create stock transaction error:", error);

    if (error instanceof StockTransactionValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to create stock transaction",
    });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const productId = req.query.product_id
      ? Number(req.query.product_id)
      : undefined;

    const transactions = await stockTransactionService.getTransactions(productId);

    return res.json(transactions);
  } catch (error) {
    console.error("Get stock transactions error:", error);
    return res.status(500).json({
      message: "Failed to fetch stock transactions",
    });
  }
};

export const getLowStock = async (req: Request, res: Response) => {
  try {
    const lowStock = await stockTransactionService.getLowStock();
    return res.json(lowStock);
  } catch (error) {
    console.error("Get low stock error:", error);
    return res.status(500).json({
      message: "Failed to fetch low stock alerts",
    });
  }
};
