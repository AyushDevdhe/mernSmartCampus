const express = require("express");
const connectDB = require("./config/database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

//importing the routes here
const userRoutes = require("./routes/userRoutes");

connectDB();

//middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
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
