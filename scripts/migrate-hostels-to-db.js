const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");
const Hostel = require("../src/models/hostel.model");

const DEFAULT_HOSTELS = [
  {
    id: 1,
    name: "ವೀರಶೈವ ಛಾತ್ರಾವಾಸ, ಬೆಂಗಳೂರು",
    location: "ರಾಜಾಜಿನಗರ, ಬೆಂಗಳೂರು - ೫೬೦ ೦೧೦",
    contact: "080-23456789",
    description: "Veerashiva boys hostel in Bangalore",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 2,
    name: "ಲಿಂಗಾಯತ ವಿದ್ಯಾರ್ಥಿ ನಿಲಯ, ಧಾರವಾಡ",
    location: "ಸ್ಟೇಷನ್ ರೋಡ್, ಧಾರವಾಡ - ೫೮೦ ೦೦೧",
    contact: "0836-2345678",
    description: "Lingayat student hostel in Dharwad",
    capacity: "80",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 3,
    name: "ಮಹಾಸಭಾ ಛಾತ್ರಾವಾಸ, ಮೈಸೂರು",
    location: "ಸಯ್ಯಾಜಿ ರಾವ್ ರಸ್ತೆ, ಮೈಸೂರು - ೫೭೦ ೦೦೧",
    contact: "0821-2345678",
    description: "Mahasabha hostel in Mysore",
    capacity: "75",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 4,
    name: "ವೀರಶೈವ ಬಾಲಕರ ನಿಲಯ, ಹುಬ್ಬಳ್ಳಿ",
    location: "ಕಲ್ಲವಾಡ ರಸ್ತೆ, ಹುಬ್ಬಳ್ಳಿ - ೫೮೦ ೦೨೩",
    contact: "0836-3456789",
    description: "Veerashiva boys hostel in Hubballi",
    capacity: "90",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 5,
    name: "ಲಿಂಗಾಯತ ಬಾಲಕಿಯರ ನಿಲಯ, ಕಲಬುರಗಿ",
    location: "ಸ್ಟೇಷನ್ ಬಜಾರ್, ಕಲಬುರಗಿ - ೫೮೫ ೧೦೧",
    contact: "08472-234567",
    description: "Lingayat girls hostel in Kalaburagi",
    capacity: "70",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 6,
    name: "ಮಹಾಸಭಾ ವಿದ್ಯಾಲಯ ನಿಲಯ, ಬೆಳಗಾವಿ",
    location: "ಕ್ಯಾಂಪ್ ರಸ್ತೆ, ಬೆಳಗಾವಿ - ೫೯೦ ೦೦೧",
    contact: "0831-2345678",
    description: "Mahasabha school hostel in Belagavi",
    capacity: "85",
    img: "/uploads/placeholders/default-portrait.svg",
  },
];

const migrateHostels = async () => {
  try {
    await connectDatabase();
    console.log("[Hostels Migration] Connected to database");

    const existingCount = await Hostel.countDocuments();
    if (existingCount > 0) {
      console.log(`[Hostels Migration] Hostels already exist (${existingCount}). Skipping migration.`);
      process.exit(0);
    }

    const inserted = await Hostel.insertMany(DEFAULT_HOSTELS);
    console.log(`[Hostels Migration] Successfully migrated ${inserted.length} hostels`);
    process.exit(0);
  } catch (error) {
    console.error("[Hostels Migration] Error:", error.message);
    process.exit(1);
  }
};

migrateHostels();
