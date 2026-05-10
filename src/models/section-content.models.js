const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const singletonSectionSchema = new mongoose.Schema(
  {
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const buildSectionModel = (modelName, collectionName) => {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  return mongoose.model(modelName, singletonSectionSchema, collectionName);
};

const SECTION_CONTENT_MODELS = Object.freeze({
  adm_text_overrides: buildSectionModel("TextOverridesContent", COLLECTION_NAMES.TEXT_OVERRIDES_CONTENT),
  adm_hero_content: buildSectionModel("HeroSectionContent", COLLECTION_NAMES.HERO_SECTION_CONTENT),
  adm_president_note_content: buildSectionModel("PresidentMessageContent", COLLECTION_NAMES.PRESIDENT_MESSAGE_CONTENT),
  adm_bhavan_content: buildSectionModel("BhavanSectionContent", COLLECTION_NAMES.BHAVAN_SECTION_CONTENT),
  adm_navbar_content: buildSectionModel("NavbarSectionContent", COLLECTION_NAMES.NAVBAR_SECTION_CONTENT),
  adm_scholarship_settings: buildSectionModel("ScholarshipSettingsContent", COLLECTION_NAMES.SCHOLARSHIP_SETTINGS_CONTENT),
  adm_footer_content: buildSectionModel("FooterSectionContent", COLLECTION_NAMES.FOOTER_SECTION_CONTENT),
  adm_cm_leaders: buildSectionModel("CommunityLeadersContent", COLLECTION_NAMES.COMMUNITY_LEADERS_CONTENT),
  adm_past_presidents: buildSectionModel("PastPresidentsContent", COLLECTION_NAMES.PAST_PRESIDENTS_CONTENT),
  adm_events: buildSectionModel("RecentEventsContent", COLLECTION_NAMES.RECENT_EVENTS_CONTENT),
  adm_directory_entries: buildSectionModel("DirectoryEntriesContent", COLLECTION_NAMES.DIRECTORY_ENTRIES_CONTENT),
  adm_org_nodes: buildSectionModel("OrgStructureContent", COLLECTION_NAMES.ORG_STRUCTURE_CONTENT),
  adm_founders: buildSectionModel("VisionariesContent", COLLECTION_NAMES.VISIONARIES_CONTENT),
  adm_tickers: buildSectionModel("MissionVisionContent", COLLECTION_NAMES.MISSION_VISION_CONTENT),
  adm_hostels: buildSectionModel("HostelsDirectoryContent", COLLECTION_NAMES.HOSTELS_DIRECTORY_CONTENT),
});

module.exports = SECTION_CONTENT_MODELS;
