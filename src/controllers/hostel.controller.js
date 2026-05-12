const Hostel = require("../models/hostel.model");
const { sendSuccess } = require("../utils/api-response");
const { STATUS_CODES, MESSAGES } = require("../constants");
const AppError = require("../utils/app-error");
const { removeManagedFile } = require("../services/media-storage.service");

const normalizeString = (value) => String(value || "").trim();

const hostelToDto = (h) => ({
  id: h.id,
  name: h.name,
  location: h.location,
  contact: h.contact,
  description: h.description,
  capacity: h.capacity,
  img: h.img,
});

class HostelController {
  list = async (req, res) => {
    const hostels = await Hostel.find({}).sort({ createdAt: 1, _id: 1 }).lean();
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      hostels: hostels.map(hostelToDto),
    });
  };

  create = async (req, res) => {
    const body = req.body || {};
    const name = normalizeString(body.name);
    const img = normalizeString(body.img);

    if (!name || !img) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const hostel = await Hostel.create({
      id: Date.now(),
      name,
      location: normalizeString(body.location),
      contact: normalizeString(body.contact),
      description: normalizeString(body.description),
      capacity: normalizeString(body.capacity),
      img,
    });

    return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.COMMON.SUCCESS, {
      hostel: hostelToDto(hostel),
    });
  };

  update = async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isFinite(itemId)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existing = await Hostel.findOne({ id: itemId });
    if (!existing) {
      throw new AppError(MESSAGES.COMMON.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    const body = req.body || {};
    if (body.name !== undefined) existing.name = normalizeString(body.name);
    if (body.location !== undefined) existing.location = normalizeString(body.location);
    if (body.contact !== undefined) existing.contact = normalizeString(body.contact);
    if (body.description !== undefined) existing.description = normalizeString(body.description);
    if (body.capacity !== undefined) existing.capacity = normalizeString(body.capacity);
    if (body.img !== undefined) existing.img = normalizeString(body.img);

    await existing.save();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      hostel: hostelToDto(existing),
    });
  };

  remove = async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isFinite(itemId)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existing = await Hostel.findOne({ id: itemId }).lean();
    if (!existing) {
      throw new AppError(MESSAGES.COMMON.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    await removeManagedFile(existing.img);
    await Hostel.deleteOne({ id: itemId });

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {});
  };
}

module.exports = HostelController;
