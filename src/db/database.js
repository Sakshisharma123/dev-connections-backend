const mongoose = require("mongoose");

const connectionDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.DB_URI}`);
    console.log(`MongoDB connected to server ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error!!", error);
    process.exit(1);
  }
};

module.exports = connectionDatabase;
