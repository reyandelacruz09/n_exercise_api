import { Request, Response } from "express";
import * as customerService from "../services/customerService";

export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const customers = await customerService.getCustomers();

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve customers",
    });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response
) => {
  try {
    const customer = await customerService.getCustomerById(
      Number(req.params.id)
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve customer",
    });
  }
};