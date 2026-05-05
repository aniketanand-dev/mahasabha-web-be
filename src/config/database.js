const mongoose = require("mongoose");
const env = require("./env");

const connectDatabase = async () => {
  await mongoose.connect(env.MONGODB_URL);
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
