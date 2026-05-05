const express = require("express");
const AuthController = require("../../controllers/auth.controller");
const asyncHandler = require("../../utils/async-handler");
const { authRateLimiter } = require("../../middleware/rate-limit.middleware");

const createAuthRoutes = ({ commandBus }) => {
  const router = express.Router();
  const controller = new AuthController({ commandBus });

  router.post("/signup", authRateLimiter, asyncHandler(controller.signup));
  router.post("/login", authRateLimiter, asyncHandler(controller.login));
  router.post("/forgot-password", authRateLimiter, asyncHandler(controller.forgotPassword));
  router.post("/reset-password", authRateLimiter, asyncHandler(controller.resetPassword));

  return router;
};

module.exports = createAuthRoutes;
