const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");
const Hostel = require("../src/models/hostel.model");

const NEW_HOSTELS = [
  {
    id: 101,
    name: "Jagajyothi Shree Basaveshwara Free Boys Hostel",
    location: "No-105, MC Badavane, Vijayanagara, Bengaluru-560040",
    contact: "080-23350755",
    description: "Managed By Karnataka Veerashaiva Vidhyaabhiruddhi Samsthe, Admission Opens On everyear June And July for BSC,BCOM,BA,BCA,BBA,BBM,BE,BDS,MBBS,BVMS,BHMS,BPHARM,DPHRAM,LLB,GNM,PYARA MEDICAL,DED,BED",
    capacity: "1000",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 102,
    name: "Gubbi Thotadappa Charities Boys Hostel",
    location: "No-88, Gubbi Thotadappa Road, Near Kranti Veera Sangoli Rayanna Railway Station, Bengaluru-560023",
    contact: "080-22879665, 080-57607572",
    description: "Hostel For Boys those who studing in Under Graduate, BE, Medical, Post Graduates",
    capacity: "1000",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 103,
    name: "Jagadguru Shree Jayadeva Murugarajendra Girls Hostel",
    location: "No-25/26, Kottigegalli, Park Road, Opp To Shri Nivasa Nursing Home, Bengaluru-560053",
    contact: "080-22913485",
    description: "Managed By Karnataka Veerashaiva Vidyabiruddhi Samsthe Admissions Opens Every Year ON June & July",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 104,
    name: "Shri B K Mariyappa Boys Hostel",
    location: "3rd Main Road, Opp To Rameshwar Temple, Kannada Sahithya Parishath Road, Chamarajapete, Bengaluru-560018",
    contact: "080-26507054",
    description: "Admissions Opens On Every Year June",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 105,
    name: "Diwan Sir K.P. Puttannachetty Veerashaiva Educational Charities",
    location: "No-32/9 & 10, Bull Temple Road, Near Ramakrishna Ashrama, Bengaluru-560004",
    contact: "080-26670922",
    description: "Admissions Opens On Every Year June, For All Combinations Students (Except PUC,BA,BSC,BCOM & CA)",
    capacity: "50",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 106,
    name: "Sri Siddaramannanavar Boys Hostel",
    location: "No-17/18, Basavanapura Main Road, Devasandra, KR Puram, Bengaluru-560036",
    contact: "080-25618244, 7204218827",
    description: "Managed By Sri Murugarajendra Charitable Trust, Admissions For All Studies After 2nd PUC",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 107,
    name: "Sri Akkamahadevi Seva Samaja Girls Hostel",
    location: "No-20, Reservoir Street, KP West Bengaluru-560020",
    contact: "080-23568643",
    description: "Hostel For 4th To 10th Standard Girls",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 108,
    name: "Sri Akkamahadevi Samaja Girls Hostel",
    location: "No-10,19th Main Road, 21st Cross Road, Rajarajeshwari Nagar, Bengaluru-560098",
    contact: "080-28603723",
    description: "Hostel For 4th To 10th Standard Girls",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 109,
    name: "T.C. Gowramma Veerashaiva Girls Hostel",
    location: "NO-56, Mariyappa Layout, Papareddi Palya, Bengaluru-560056",
    contact: "7204334312",
    description: "Admissions Opens On Every Year June & July For Only Deegre & BE Students",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 110,
    name: "Nolamba Lingayath Sangha (R) Kambi M Siddaramanna Boys And Girls Hostel",
    location: "No-1/A, 1st A Cross Road, 3rd Stage, 4th Block, Basaveshwaranagar, Bengaluru-560079",
    contact: "080-23427006",
    description: "Admission Opens on Every Year July",
    capacity: "1000",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 111,
    name: "Sarpabhushana Girls Hostel",
    location: "11th Main Road, RPC Layout, Vijayanagar, Bengaluru-560040",
    contact: "080-22879777",
    description: "Admissions Opens On Every Year June For BE 7 UG Students",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 112,
    name: "Sarpabhushana Boys Hostel",
    location: "No-22, KG Circle, Bengaluru-560009",
    contact: "080-22879777",
    description: "Admissions Opens ON Every Year June",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 113,
    name: "Smt Sarwamangala Surenahalli Siddaiah Girls Hostel",
    location: "No-7/B, 1st Main Road, 1st Block, Mahalakshmipuram, Bengaluru-560087",
    contact: "080-23427006",
    description: "Admissions Opens On Every Year July",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
  {
    id: 114,
    name: "Smt T.C. Gowramma Veerashaiva Boys Hostel",
    location: "No-192, OTC Road, Chikkapete, Bengaluru-560053",
    contact: "9844326398",
    description: "Admissions Opens On Every Year June For PUC,DED,BED,BE Students",
    capacity: "100",
    img: "/uploads/placeholders/default-portrait.svg",
  },
];

const migrateNewHostels = async () => {
  try {
    await connectDatabase();
    console.log("[New Hostels Migration] Connected to database");

    // Check and insert each hostel individually to avoid duplicates
    let insertedCount = 0;
    for (const hostel of NEW_HOSTELS) {
      const existing = await Hostel.findOne({ id: hostel.id });
      if (!existing) {
        await Hostel.create(hostel);
        insertedCount++;
        console.log(`[New Hostels Migration] Added: ${hostel.name}`);
      } else {
        console.log(`[New Hostels Migration] Already exists: ${hostel.name}`);
      }
    }

    console.log(`[New Hostels Migration] Successfully added ${insertedCount} new hostels`);
    process.exit(0);
  } catch (error) {
    console.error("[New Hostels Migration] Error:", error.message);
    process.exit(1);
  }
};

migrateNewHostels();
