const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const createBuses = require("./cqrs");
const createV1Routes = require("./routes/v1");
const mediaRoutes = require("./routes/media.routes");
const notFoundHandler = require("./middleware/not-found.middleware");
const errorHandler = require("./middleware/error-handler.middleware");
const env = require("./config/env");
const { STATIC_VALUES } = require("./constants");
const paths = require("./config/paths");

const app = express();
const { commandBus } = createBuses();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/uploads", express.static(paths.uploadsRootDir));
app.use(mediaRoutes);

app.use(STATIC_VALUES.API_PREFIX, createV1Routes({ commandBus }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
