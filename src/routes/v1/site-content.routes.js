const express = require("express");
const SiteContentController = require("../../controllers/site-content.controller");
const asyncHandler = require("../../utils/async-handler");
const { requireAdminAuth } = require("../../middleware/auth.middleware");

const router = express.Router();
const controller = new SiteContentController();

router.get("/", asyncHandler(controller.list));
router.put("/:key", requireAdminAuth, asyncHandler(controller.upsert));

module.exports = router;
