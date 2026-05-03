const express = require("express");
const AuthController = require("../../controllers/auth.controller");
const asyncHandler = require("../../utils/async-handler");

const createAuthRoutes = ({ commandBus }) => {
  const router = express.Router();
  const controller = new AuthController({ commandBus });

  router.post("/signup", asyncHandler(controller.signup));
  router.post("/login", asyncHandler(controller.login));
  router.post("/forgot-password", asyncHandler(controller.forgotPassword));
  router.post("/reset-password", asyncHandler(controller.resetPassword));

  return router;
};

module.exports = createAuthRoutes;
