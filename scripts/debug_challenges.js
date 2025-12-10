const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require('path');

// Load env correctly
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const debugChallenges = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const challenges = await mongoose.connection.db.collection("challenges").find().toArray();
        console.log(`Found ${challenges.length} challenges.`);

        challenges.forEach(c => {
            console.log("--------------------------------");
            console.log(`Title: ${c.title}`);
            console.log(`Status: ${c.status}`);
            console.log(`Start: ${c.startDate}`);
            console.log(`End:   ${c.endDate}`);
            console.log(`Now:   ${new Date().toISOString()}`);
            console.log(`Is Expired? ${new Date() > new Date(c.endDate)}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

debugChallenges();
