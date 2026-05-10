const Counter = require("../models/counter.model");
const SiteVisitor = require("../models/site-visitor.model");
const { MESSAGES, STATUS_CODES } = require("../constants");
const { sendSuccess } = require("../utils/api-response");
const AppError = require("../utils/app-error");

const TOTAL_VISITS_COUNTER_ID = "siteTotalVisits";
const UNIQUE_VISITORS_COUNTER_ID = "siteUniqueVisitors";

const asTrimmedString = (value) => String(value || "").trim();

const readCounterValue = async (counterId) => {
  const counter = await Counter.findById(counterId).lean();
  return Number(counter?.value || 0);
};

class AnalyticsController {
  trackVisit = async (req, res) => {
    const visitorId = asTrimmedString(req.body?.visitorId);
    const path = asTrimmedString(req.body?.path) || "/";
    const referrer = asTrimmedString(req.body?.referrer);

    if (!visitorId) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const now = new Date();
    const ip = asTrimmedString(req.ip || req.headers["x-forwarded-for"] || "");
    const userAgent = asTrimmedString(req.headers["user-agent"] || "");

    await Counter.findOneAndUpdate(
      { _id: TOTAL_VISITS_COUNTER_ID },
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const visitorResult = await SiteVisitor.updateOne(
      { visitorId },
      {
        $set: {
          lastVisitedAt: now,
          lastPath: path,
          lastReferrer: referrer,
          lastUserAgent: userAgent,
          lastIp: ip,
        },
        $setOnInsert: {
          firstVisitedAt: now,
        },
        $inc: {
          visitCount: 1,
        },
      },
      { upsert: true }
    );

    const isNewVisitor = Boolean(visitorResult?.upsertedCount);

    if (isNewVisitor) {
      await Counter.findOneAndUpdate(
        { _id: UNIQUE_VISITORS_COUNTER_ID },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();
    }

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      isNewVisitor,
    });
  };

  getStats = async (_req, res) => {
    const [totalVisits, uniqueVisitors, lastVisitor] = await Promise.all([
      readCounterValue(TOTAL_VISITS_COUNTER_ID),
      readCounterValue(UNIQUE_VISITORS_COUNTER_ID),
      SiteVisitor.findOne({}).sort({ lastVisitedAt: -1, _id: -1 }).lean(),
    ]);

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      totalVisits,
      uniqueVisitors,
      lastVisitedAt: lastVisitor?.lastVisitedAt || null,
    });
  };
}

module.exports = AnalyticsController;
