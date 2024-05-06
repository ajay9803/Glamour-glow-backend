const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const routes = require("./routes/index");
const port = 8080;
const databaseUrl = "mongodb://localhost:27017/online-beauty-store";
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

var cors = require("cors");

app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(bodyParser.json());
app.use("/", routes);

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(statusCode).json({
    message: message,
    data: data,
  });
});

app.use("/images", express.static(path.join(__dirname, "/images")));
let messages = [];

mongoose
  .connect(databaseUrl)
  .then((_) => {
    io.on("connection", (socket) => {
      socket.on("chat-message", (message) => {
        messages.push(message);
        io.emit("messages", messages);
      });
    });
    server.listen(port, () => {
      console.log("Server is running on port: 8080");
    });
  })
  .catch((e) => {
    console.log(e);
  });
