const express = require("express");
const connectDB = require("./config/database");
require("dotenv").config();

const app = express();

//importing the routes here
const userRoutes = require("./routes/userRoutes");

connectDB();

//middlewares
app.use(express.json());

//routes here
app.use("/api/users", userRoutes);

//test api
app.get("/", (req, res) => {
  res.send("backend app is running");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
