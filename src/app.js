const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

const userRouter = require("./routes/user.routes.js");
const connectionRouter = require("./routes/connection.routes.js");

app.use("/api/v1/users", userRouter);
app.use("/api/v1/connections", connectionRouter);


module.exports = app;
