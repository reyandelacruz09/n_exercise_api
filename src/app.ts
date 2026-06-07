import express from "express";
import usersRoute from "./routes/userRoutes";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";

const app = express();

app.use(express.json());


app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/users", usersRoute);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
