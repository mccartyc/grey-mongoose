require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
    });
    console.log("MongoDB Connected:", conn.connection.host);
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1); // Exit with error
  }
})();
