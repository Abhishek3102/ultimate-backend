import mongoose from "mongoose";
import dotenv from "dotenv";
import { Challenge } from "../src/models/challenge.model.js";
import { User } from "../src/models/user.model.js";

dotenv.config({ path: "./.env" });

const seedArena = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 0. Find an existing user to be the creator
        let adminUser = await User.findOne();
        if (!adminUser) {
            console.log("No users found. Creating a dummy admin...");
            adminUser = await User.create({
                username: "arena_admin",
                email: "admin@arena.com",
                fullName: "Arena Admin",
                password: "password123", // In real app, hash this, but for seed it might bypass or trigger hooks
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809"
            });
        }
        console.log("Using Creator:", adminUser.username);

        // 1. Create an Active Challenge (Ends in 24 hours)
        const activeChallenge = await Challenge.create({
            title: "Best Sunset Photography",
            description: "Capture the most stunning sunset from your city. Highest votes wins!",
            type: "image",
            startDate: new Date(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
            status: "active",
            banner: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000",
            rewardParams: { type: "badge", value: "Sunset Chaser" },
            createdBy: adminUser._id
        });
        console.log("Created Active Challenge:", activeChallenge.title);

        // 2. Create a Challenge Ending Soon (Ends in 2 minutes) - To test timer
        const endingSoonChallenge = await Challenge.create({
            title: "Fastest Rapper Alive",
            description: "Submit a 30s rap video. Hurry!",
            type: "video",
            startDate: new Date(),
            endDate: new Date(Date.now() + 2 * 60 * 1000), // +2 minutes
            status: "active",
            banner: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&q=80&w=1000",
            rewardParams: { type: "cash", value: "100" },
            createdBy: adminUser._id
        });
        console.log("Created Ending Soon Challenge:", endingSoonChallenge.title);

        console.log("Done Seeding Arena!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedArena();
