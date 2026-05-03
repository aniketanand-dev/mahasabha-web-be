const mongoose = require("mongoose");
const env = require("./env");

const connectDatabase = async () => {
  await mongoose.connect(env.MONGODB_URL);
};

module.exports = { connectDatabase };
