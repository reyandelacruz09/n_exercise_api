import { Request, Response } from "express";
import * as orderService from "../services/orderService";

export const getOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await orderService.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve order",
    });
  }
};

export const getOrdersById = async(
  req: Request,
  res: Response
) => {
  try {
    const order = await orderService.getOrderById(
      Number(req.params.id)
    )
    if (!order){
      return res.status(404).json({
        message: "Order not found"
      })
    }
    res.json(order)
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve order",
    });
  }
};

export const createOrder = async(
  req: Request,
  res: Response
) => {
  try {
    const { amount, customer_id} = req.body

    if (!amount || customer_id == undefined){
      return res.status(400).json({
        message: "Please complete the mandatory inputs",
      });
    }
    const order = await orderService.createOrder(
      Number(amount),
      Number(customer_id)
    );

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });

  }catch (error){
    console.error("Create Order error:", error);

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
}