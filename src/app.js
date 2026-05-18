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
const { apiRateLimiter } = require("./middleware/rate-limit.middleware");
const env = require("./config/env");
const { STATIC_VALUES } = require("./constants");
const paths = require("./config/paths");

const app = express();
const { commandBus } = createBuses();

if (env.TRUST_PROXY !== false) {
  app.set("trust proxy", env.TRUST_PROXY);
}

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(
  cors({
    origin: true,
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

app.use(
  "/uploads",
  (_request, response, next) => {
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(paths.uploadsRootDir, {
    maxAge: "30d",
    immutable: true,
    setHeaders: (response) => {
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
  })
);
app.use(mediaRoutes);

app.use(STATIC_VALUES.API_PREFIX, apiRateLimiter, createV1Routes({ commandBus }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
