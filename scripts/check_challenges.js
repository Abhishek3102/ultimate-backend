const mongoose = require("mongoose");
const dotenv = require("dotenv");

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const checkChallenges = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const challengeCount = await mongoose.connection.db.collection("challenges").countDocuments();
    console.log(`Challenges count: ${challengeCount}`);

    if (challengeCount > 0) {
      const challenges = await mongoose.connection.db.collection("challenges").find().toArray();
      console.log("First challenge:", JSON.stringify(challenges[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkChallenges();
