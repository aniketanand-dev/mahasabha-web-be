const express = require("express");
const AnalyticsController = require("../../controllers/analytics.controller");
const { requireAdminAuth } = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/async-handler");

const router = express.Router();
const controller = new AnalyticsController();

router.post("/visit", asyncHandler(controller.trackVisit));
router.get("/stats", requireAdminAuth, asyncHandler(controller.getStats));

module.exports = router;
