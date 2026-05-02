import express from "express";
import usersRoute from "./routes/users";
import employeeRoutes from "./routes/employee";
import taskRoutes from "./routes/tasks";

const app = express();

app.use(express.json());


app.use("/employees", employeeRoutes);
app.use("/tasks", taskRoutes);
app.use("/users", usersRoute);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
