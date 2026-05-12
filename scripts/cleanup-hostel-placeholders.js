const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");
const Hostel = require("../src/models/hostel.model");

const PLACEHOLDER_IDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

const cleanupPlaceholders = async () => {
  try {
    await connectDatabase();
    console.log("[Hostels Cleanup] Connected to database");

    const result = await Hostel.deleteMany({ id: { $in: PLACEHOLDER_IDS } });
    
    console.log(`[Hostels Cleanup] Removed ${result.deletedCount} placeholder entries`);
    
    const totalCount = await Hostel.countDocuments();
    console.log(`[Hostels Cleanup] Total hostels remaining: ${totalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("[Hostels Cleanup] Error:", error.message);
    process.exit(1);
  }
};

cleanupPlaceholders();
