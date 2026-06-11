const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const ORGANIZATION_LEVELS = Object.freeze(["state", "district", "city", "corporation", "assembly", "taluk"]);

const locationSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, trim: true },
    district: { type: String, trim: true, default: "" },
    taluk: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const memberImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: "" },
    alt: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const organizationStructureNodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    image: { type: memberImageSchema, default: () => ({}) },
    level: { type: String, enum: ORGANIZATION_LEVELS, required: true },
    location: { type: locationSchema, required: true },
    sidebarLabel: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    parentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganizationStructureNode",
      default: null
    },
    updatedBy: { type: String, default: null }
  },
  {
    timestamps: true,
    minimize: false
  }
);

organizationStructureNodeSchema.index({ level: 1, "location.state": 1, "location.district": 1, "location.taluk": 1 });
organizationStructureNodeSchema.index({ parentNodeId: 1, displayOrder: 1, createdAt: 1 });
organizationStructureNodeSchema.index({ isActive: 1, level: 1 });

const OrganizationStructureNode = mongoose.models.OrganizationStructureNode
  || mongoose.model(
    "OrganizationStructureNode",
    organizationStructureNodeSchema,
    COLLECTION_NAMES.ORGANIZATION_STRUCTURE_NODES
  );

module.exports = {
  OrganizationStructureNode,
  ORGANIZATION_LEVELS
};
