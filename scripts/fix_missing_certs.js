import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { Challenge } from "../src/models/challenge.model.js";
import { ArenaEntry } from "../src/models/arenaEntry.model.js";

// Load Environment Variables
dotenv.config({ path: './.env.local' });
if (!process.env.MONGODB_URI) dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://doadmin:q37k84051X9JcP6R@db-mongodb-blr1-85261-75896be8.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-blr1-85261";
const DB_NAME = process.env.DB_NAME || "chai-backend-main";

const fixCertificates = async () => {
    try {
        console.log("Connecting to DB...", MONGO_URI.substring(0, 20) + "...");
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log("Connected.");

        // 1. Find all completed challenges
        const completedChallenges = await Challenge.find({ status: 'completed' });
        console.log(`Found ${completedChallenges.length} completed challenges.`);

        for (const challenge of completedChallenges) {
            // Check winners
            if (!challenge.winnerIds || challenge.winnerIds.length === 0) {
                console.log(`Challenge "${challenge.title}" has no winners recorded.`);
                continue;
            }

            console.log(`Checking winners for "${challenge.title}"...`);

            for (const winner of challenge.winnerIds) {
                if (!winner.user) continue;

                const user = await User.findById(winner.user);
                if (!user) {
                    console.log(`User ${winner.user} not found.`);
                    continue;
                }

                // Expected Certificate Name
                const expectedCertName = `${winner.rank === 1 ? "Gold Champion" : winner.rank === 2 ? "Silver Runner-Up" : "Bronze Finalist"}: ${challenge.title}`;
                
                // Find existing cert
                const certIndex = user.certificates.findIndex(c => 
                    (c.challengeId && c.challengeId.toString() === challenge._id.toString()) ||
                    c.name === expectedCertName
                );

                if (certIndex !== -1) {
                    // Check if entryId is missing and patch it
                    if (!user.certificates[certIndex].entryId && winner.entry) {
                         console.log(`⚠️ User ${user.username} has cert but MISSING entryId. Patching...`);
                         user.certificates[certIndex].entryId = winner.entry;
                         await user.save();
                         console.log(`✅ Patched entryId for ${user.username}`);
                    } else {
                         console.log(`✅ User ${user.username} has complete certificate.`);
                    }
                } else {
                    console.log(`❌ User ${user.username} MISSING certificate. Awarding now...`);
                    
                    user.certificates.push({
                        name: expectedCertName,
                        challengeId: challenge._id,
                        entryId: winner.entry, // Add Entry ID
                        rank: winner.rank,
                        date: new Date()
                    });

                    await user.save();
                    console.log(`🎉 Awarded certificate to ${user.username}`);
                }
            }
        }

        console.log("Done checking certificates.");
        process.exit(0);

    } catch (error) {
        console.error("Script failed:", error);
        process.exit(1);
    }
};

fixCertificates();
