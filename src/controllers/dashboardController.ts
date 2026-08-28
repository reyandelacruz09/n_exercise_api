import { Request, Response } from "express";
import { dashboardService } from "../services/dashboardService";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const [counts, monthlyOrders, recentOrders] = await Promise.all([
      dashboardService.getCounts(),
      dashboardService.getMonthlyOrders(),
      dashboardService.getRecentOrders(),
    ]);

    return res.json({
      ...counts,
      monthlyOrders,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
