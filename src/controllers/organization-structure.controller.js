const mongoose = require("mongoose");
const { sendSuccess } = require("../utils/api-response");
const { STATUS_CODES, MESSAGES } = require("../constants");
const AppError = require("../utils/app-error");
const {
  OrganizationStructureNode,
  ORGANIZATION_LEVELS
} = require("../models/organization-structure-node.model");

const LEVEL_ORDER = Object.freeze({
  state: 0,
  district: 1,
  taluk: 2
});

const SIMPLE_SECTION_LABELS = Object.freeze([
  "president-office",
  "working-committee",
  "representative-general-body",
  "nominated-body"
]);

const STATE_COMMITTEE_LABEL = "state-committee";
const REPRESENTATIVE_SECTION_LABEL = "representative-general-body";

const normalizeString = (value) => String(value || "").trim();
const normalizeLabel = (value) => normalizeString(value).toLowerCase();
const isSimpleSectionLabel = (value) => SIMPLE_SECTION_LABELS.includes(normalizeLabel(value));
const isStateCommitteeContainerNode = (node) => normalizeLabel(node?.sidebarLabel) === STATE_COMMITTEE_LABEL
  && normalizeLabel(node?.designation) === "state committee"
  && normalizeLabel(node?.level) === "state"
  && !normalizeString(node?.location?.district)
  && !normalizeString(node?.location?.taluk);
const normalizeUpdatedBy = (value) => {
  const normalized = normalizeString(value);
  return normalized && mongoose.isValidObjectId(normalized) ? normalized : null;
};

const normalizeLocation = (location = {}) => ({
  state: normalizeString(location.state),
  district: normalizeString(location.district),
  taluk: normalizeString(location.taluk)
});

const serializeNode = (node) => ({
  id: String(node._id || node.id),
  name: node.name,
  designation: node.designation,
  contact: normalizeString(node.contact),
  description: node.description || "",
  image: {
    url: normalizeString(node.image?.url),
    alt: normalizeString(node.image?.alt)
  },
  level: node.level,
  location: {
    state: normalizeString(node.location?.state),
    district: normalizeString(node.location?.district),
    taluk: normalizeString(node.location?.taluk)
  },
  sidebarLabel: node.sidebarLabel || node.designation || node.name,
  displayOrder: Number.isFinite(node.displayOrder) ? node.displayOrder : 0,
  isActive: node.isActive !== false,
  parentNodeId: node.parentNodeId ? String(node.parentNodeId) : null,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt
});

const buildNodeTree = (nodes) => {
  const nodeMap = new Map();

  for (const node of nodes) {
    nodeMap.set(String(node._id), { ...serializeNode(node), children: [] });
  }

  const roots = [];

  for (const node of nodes) {
    const current = nodeMap.get(String(node._id));
    const parentId = node.parentNodeId ? String(node.parentNodeId) : null;

    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId).children.push(current);
      continue;
    }

    roots.push(current);
  }

  const sortTree = (branch) => {
    branch.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      if (a.level !== b.level) {
        return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      }

      return a.name.localeCompare(b.name);
    });

    for (const node of branch) {
      if (node.children.length) {
        sortTree(node.children);
      }
    }
  };

  sortTree(roots);
  return roots;
};

class OrganizationStructureController {
  ensureNoCircularParent = async ({ nodeId, parentNodeId }) => {
    if (!nodeId || !parentNodeId) {
      return;
    }

    let cursor = await OrganizationStructureNode.findById(parentNodeId)
      .select({ _id: 1, parentNodeId: 1 })
      .lean();

    while (cursor) {
      if (String(cursor._id) === String(nodeId)) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
      }

      if (!cursor.parentNodeId) {
        break;
      }

      cursor = await OrganizationStructureNode.findById(cursor.parentNodeId)
        .select({ _id: 1, parentNodeId: 1 })
        .lean();
    }
  };

  validatePayload = async ({ body = {}, existingNode = null }) => {
    const name = normalizeString(body.name !== undefined ? body.name : existingNode?.name);
    const designation = normalizeString(body.designation !== undefined ? body.designation : existingNode?.designation);
    const contact = normalizeString(body.contact !== undefined ? body.contact : existingNode?.contact);
    const description = normalizeString(body.description !== undefined ? body.description : existingNode?.description);
    const sidebarLabel = normalizeString(body.sidebarLabel !== undefined ? body.sidebarLabel : existingNode?.sidebarLabel);
    const isSimpleSection = isSimpleSectionLabel(sidebarLabel);

    const levelCandidate = body.level !== undefined ? normalizeString(body.level) : existingNode?.level;
    const level = String(levelCandidate || "").toLowerCase();

    const rawLocation = body.location !== undefined ? body.location : existingNode?.location;
    const location = normalizeLocation(rawLocation);

    const imageInput = body.image !== undefined ? body.image : existingNode?.image || {};
    const image = {
      url: normalizeString(imageInput?.url),
      alt: normalizeString(imageInput?.alt)
    };

    const displayOrderValue = body.displayOrder !== undefined ? body.displayOrder : existingNode?.displayOrder;
    const displayOrder = Number(displayOrderValue ?? 0);

    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : existingNode?.isActive !== false;

    const rawParentNodeId = body.parentNodeId !== undefined ? body.parentNodeId : existingNode?.parentNodeId;
    const parentNodeIdText = normalizeString(rawParentNodeId);
    const parentNodeId = parentNodeIdText ? parentNodeIdText : null;

    if (!name || !designation || !ORGANIZATION_LEVELS.includes(level) || !location.state) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PAYLOAD, STATUS_CODES.BAD_REQUEST);
    }

    if (!Number.isFinite(displayOrder)) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PAYLOAD, STATUS_CODES.BAD_REQUEST);
    }

    if (level === "state") {
      if (location.district || location.taluk) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_LOCATION_HIERARCHY, STATUS_CODES.BAD_REQUEST);
      }
    }

    if (isSimpleSection && level !== "state") {
      throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_LOCATION_HIERARCHY, STATUS_CODES.BAD_REQUEST);
    }

    if (level === "district") {
      if (!location.district || location.taluk) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_LOCATION_HIERARCHY, STATUS_CODES.BAD_REQUEST);
      }
    }

    if (level === "taluk") {
      if (!location.district || !location.taluk) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_LOCATION_HIERARCHY, STATUS_CODES.BAD_REQUEST);
      }
    }

    if (existingNode && parentNodeId && String(existingNode._id) === parentNodeId) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
    }

    let parentNode = null;

    if (parentNodeId) {
      if (!mongoose.isValidObjectId(parentNodeId)) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
      }

      parentNode = await OrganizationStructureNode.findById(parentNodeId).lean();
      if (!parentNode) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.PARENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      const parentIsSimpleSection = isSimpleSectionLabel(parentNode.sidebarLabel);
      const allowSimpleSectionParent = isSimpleSection
        && parentIsSimpleSection
        && normalizeLabel(parentNode.sidebarLabel) === normalizeLabel(sidebarLabel)
        && parentNode.level === level;

      const allowRepresentativeStateCommitteeParent = normalizeLabel(parentNode.sidebarLabel) === REPRESENTATIVE_SECTION_LABEL
        && normalizeLabel(sidebarLabel) === STATE_COMMITTEE_LABEL
        && parentNode.level === "state"
        && level === "state";

      const allowStateCommitteeContainerParent = isStateCommitteeContainerNode(parentNode)
        && normalizeLabel(sidebarLabel) === STATE_COMMITTEE_LABEL
        && level === "state";

      const allowStateCommitteeMemberParent = normalizeLabel(parentNode.sidebarLabel) === STATE_COMMITTEE_LABEL
        && normalizeLabel(sidebarLabel) === STATE_COMMITTEE_LABEL
        && parentNode.level === level
        && parentNode.location.state === location.state
        && normalizeString(parentNode.location?.district) === location.district
        && normalizeString(parentNode.location?.taluk) === location.taluk;

      const allowEqualLevelParent = allowRepresentativeStateCommitteeParent
        || allowStateCommitteeContainerParent
        || allowStateCommitteeMemberParent;

      if (!allowSimpleSectionParent && !allowEqualLevelParent && LEVEL_ORDER[parentNode.level] >= LEVEL_ORDER[level]) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
      }

      if (!allowStateCommitteeContainerParent && parentNode.location.state !== location.state) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT_LOCATION, STATUS_CODES.BAD_REQUEST);
      }

      if (allowSimpleSectionParent) {
        if (normalizeString(parentNode.location?.district) || normalizeString(parentNode.location?.taluk)) {
          throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT_LOCATION, STATUS_CODES.BAD_REQUEST);
        }
      }

      if (!allowSimpleSectionParent && !allowEqualLevelParent && level === "district" && parentNode.level !== "state") {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
      }

      if (!allowSimpleSectionParent && !allowEqualLevelParent && level === "taluk" && parentNode.level !== "district") {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT, STATUS_CODES.BAD_REQUEST);
      }

      if (!allowSimpleSectionParent && !allowEqualLevelParent && level === "district" && parentNode.location.district) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT_LOCATION, STATUS_CODES.BAD_REQUEST);
      }

      if (!allowSimpleSectionParent && !allowEqualLevelParent && level === "taluk" && parentNode.location.district !== location.district) {
        throw new AppError(MESSAGES.ORG_STRUCTURE.INVALID_PARENT_LOCATION, STATUS_CODES.BAD_REQUEST);
      }
    } else if (level !== "state") {
      throw new AppError(MESSAGES.ORG_STRUCTURE.PARENT_REQUIRED, STATUS_CODES.BAD_REQUEST);
    }

    if (existingNode) {
      await this.ensureNoCircularParent({ nodeId: existingNode._id, parentNodeId });

      const hierarchyChanged = existingNode.level !== level
        || normalizeString(existingNode.location?.state) !== location.state
        || normalizeString(existingNode.location?.district) !== location.district
        || normalizeString(existingNode.location?.taluk) !== location.taluk;

      if (hierarchyChanged) {
        const childCount = await OrganizationStructureNode.countDocuments({ parentNodeId: existingNode._id });
        if (childCount > 0) {
          throw new AppError(MESSAGES.ORG_STRUCTURE.HIERARCHY_CHANGE_BLOCKED, STATUS_CODES.CONFLICT);
        }
      }
    }

    return {
      name,
      designation,
      contact,
      description,
      image,
      level,
      location,
      sidebarLabel,
      displayOrder,
      isActive,
      parentNodeId: parentNode ? parentNode._id : null
    };
  };

  list = async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const state = normalizeString(req.query.state);
    const district = normalizeString(req.query.district);
    const taluk = normalizeString(req.query.taluk);

    const filters = {};
    if (!includeInactive) {
      filters.isActive = true;
    }

    if (state) {
      filters["location.state"] = state;
    }

    if (district) {
      filters["location.district"] = district;
    }

    if (taluk) {
      filters["location.taluk"] = taluk;
    }

    const nodes = await OrganizationStructureNode.find(filters)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      tree: buildNodeTree(nodes)
    });
  };

  listSidebar = async (req, res) => {
    const state = normalizeString(req.query.state);
    const district = normalizeString(req.query.district);
    const taluk = normalizeString(req.query.taluk);

    const filters = { isActive: true };

    if (state) {
      filters["location.state"] = state;
    }

    if (district) {
      filters["location.district"] = district;
    }

    if (taluk) {
      filters["location.taluk"] = taluk;
    }

    const nodes = await OrganizationStructureNode.find(filters)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    const buildSidebarItems = (branch) =>
      branch.map((node) => ({
        id: node.id,
        label: node.sidebarLabel || node.designation || node.name,
        level: node.level,
        location: node.location,
        children: buildSidebarItems(node.children || [])
      }));

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      items: buildSidebarItems(buildNodeTree(nodes))
    });
  };

  create = async (req, res) => {
    const payload = await this.validatePayload({ body: req.body });
    const updatedBy = normalizeUpdatedBy(req.user?.sub);

    const created = await OrganizationStructureNode.create({
      ...payload,
      updatedBy
    });

    return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.ORG_STRUCTURE.CREATED, {
      node: serializeNode(created)
    });
  };

  update = async (req, res) => {
    const nodeId = normalizeString(req.params.id);
    if (!mongoose.isValidObjectId(nodeId)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existing = await OrganizationStructureNode.findById(nodeId);
    if (!existing) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    const payload = await this.validatePayload({ body: req.body, existingNode: existing });

    existing.name = payload.name;
    existing.designation = payload.designation;
    existing.contact = payload.contact;
    existing.description = payload.description;
    existing.image = payload.image;
    existing.level = payload.level;
    existing.location = payload.location;
    existing.sidebarLabel = payload.sidebarLabel;
    existing.displayOrder = payload.displayOrder;
    existing.isActive = payload.isActive;
    existing.parentNodeId = payload.parentNodeId;
    existing.updatedBy = normalizeUpdatedBy(req.user?.sub);

    await existing.save();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.ORG_STRUCTURE.UPDATED, {
      node: serializeNode(existing)
    });
  };

  remove = async (req, res) => {
    const nodeId = normalizeString(req.params.id);
    if (!mongoose.isValidObjectId(nodeId)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existing = await OrganizationStructureNode.findById(nodeId).lean();
    if (!existing) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    const childCount = await OrganizationStructureNode.countDocuments({ parentNodeId: existing._id });
    if (childCount > 0) {
      throw new AppError(MESSAGES.ORG_STRUCTURE.HAS_CHILDREN, STATUS_CODES.CONFLICT);
    }

    await OrganizationStructureNode.deleteOne({ _id: existing._id });

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.ORG_STRUCTURE.DELETED, {});
  };
}

module.exports = OrganizationStructureController;
