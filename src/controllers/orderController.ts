import { Request, Response } from "express";
import * as orderService from "../services/orderService";

export const getOrders = async (
  req: Request,
  res: Response
) => {
  const orders = await orderService.getOrders();

  res.json(orders);
};