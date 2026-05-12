const express = require("express");
const createAuthRoutes = require("./auth.routes");
const analyticsRoutes = require("./analytics.routes");
const scholarshipRoutes = require("./scholarship.routes");
const siteContentRoutes = require("./site-content.routes");
const hostelRoutes = require("./hostel.routes");
const { STATIC_VALUES } = require("../../constants");

const createV1Routes = ({ commandBus }) => {
  const router = express.Router();

  router.use(STATIC_VALUES.AUTH_PREFIX, createAuthRoutes({ commandBus }));
  router.use("/analytics", analyticsRoutes);
  router.use("/scholarships", scholarshipRoutes);
  router.use("/site-content", siteContentRoutes);
  router.use("/hostels", hostelRoutes);

  return router;
};

module.exports = createV1Routes;
