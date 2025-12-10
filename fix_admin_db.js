import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { User } from "./src/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_NAME = "videotube";

dotenv.config({ path: path.join(__dirname, '.env') });

const fixAdmin = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${DB_NAME}`;
        console.log("Connecting to:", uri);
        
        await mongoose.connect(uri);
        console.log("✅ Connected to Real DB (videotube)");

        const email = "admin@arena.com";
        const user = await User.findOne({ email });

        if (user) {
            console.log("Found existing user in videotube DB.");
            // Force reset everything to be sure
            user.role = "admin";
            user.username = "arena_admin"; 
            user.password = "password123"; // Re-hash password
            await user.save(); 
            console.log("✅ Updated existing user: Admin Role + Password Reset");
        } else {
            console.log("User NOT found in 'videotube'. Creating new Admin...");
            const newUser = new User({
                username: "arena_admin",
                email: "admin@arena.com",
                fullName: "Arena Admin",
                password: "password123", // Will be hashed by pre-save
                role: "admin",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                coverImage: ""
            });
            await newUser.save();
            console.log("✅ Created New Admin User in 'videotube' DB.");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

fixAdmin();
