import mongoose, { Schema } from "mongoose";

const pulseSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 280 // Tweet lengthish
        },
        embedding: {
            type: [Number], // Vector arr
            required: true,
            index: true // We might need vector search index later, but standard for now
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "matched", "expired"],
            default: "pending",
            index: true
        },
        matchedWith: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// TTL Index: Automatically delete thought after 15 minutes if not matched (or just strictly clear old ones)
// We want "Active Thoughts" to be relevant. 10-15 mins is good.
pulseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); 

export const Pulse = mongoose.model("Pulse", pulseSchema);
