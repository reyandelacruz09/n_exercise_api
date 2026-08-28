import express from "express";
import dotenv from "dotenv";
import usersRoute from "./routes/userRoutes";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import stockTransactionRoutes from "./routes/stockTransactionRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  console.log("CONTENT TYPE:", req.headers["content-type"]);
  next();
});

app.use("/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stock-transactions", stockTransactionRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", usersRoute);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
