import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createManualChallenge = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Find Admin
        const user = await mongoose.connection.db.collection("users").findOne({ username: "arena_admin" });
        if (!user) {
            console.log("Admin user not found! Run seed_arena.js first.");
            process.exit(1);
        }

        const challenge = {
            title: "Manual Challenge: Best Code Setup",
            description: "Show us your coding environment!",
            type: "image",
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: "active",
            banner: "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
            rewardParams: { type: "badge", value: "Coder" },
            createdBy: user._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        };

        const result = await mongoose.connection.db.collection("challenges").insertOne(challenge);
        console.log("Created Challenge ID:", result.insertedId);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

createManualChallenge();
