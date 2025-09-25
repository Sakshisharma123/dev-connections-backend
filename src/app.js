const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(
  cors({
    origin:  process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

const errorHandler = require("./middlewares/error.middleware");

const userRouter = require("./routes/user.routes.js");
const connectionRouter = require("./routes/connection.routes.js");

app.use("/api/v1/users", userRouter);
app.use("/api/v1/connections", connectionRouter);


app.use(errorHandler);

module.exports = app;
