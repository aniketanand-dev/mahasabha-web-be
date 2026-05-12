const express = require("express");
const HostelController = require("../../controllers/hostel.controller");
const asyncHandler = require("../../utils/async-handler");
const { requireAdminAuth } = require("../../middleware/auth.middleware");

const router = express.Router();
const controller = new HostelController();

router.get("/", asyncHandler(controller.list));
router.post("/", requireAdminAuth, asyncHandler(controller.create));
router.patch("/:id", requireAdminAuth, asyncHandler(controller.update));
router.delete("/:id", requireAdminAuth, asyncHandler(controller.remove));

module.exports = router;
