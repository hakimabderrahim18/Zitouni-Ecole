const mongoose = require('mongoose');
const { ensureCoreAccounts } = require('../autoSeed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureCoreAccounts();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
