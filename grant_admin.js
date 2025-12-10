import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const grantAdminRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const result = await mongoose.connection.db.collection("users").updateOne(
            { username: "arena_admin" },
            { $set: { role: "admin" } }
        );

        if (result.matchedCount === 0) {
            console.log("User 'arena_admin' not found.");
        } else {
            console.log("Successfully granted ADMIN role to 'arena_admin'");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

grantAdminRole();
