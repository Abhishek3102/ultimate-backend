import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["text", "image", "video", "mixed"],
            default: "mixed"
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active"
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User", // Admin or Creator
            required: true
        },
        banner: {
            type: String, // URL
            default: ""
        },
        rewardParams: {
            badgeIcon: { type: String, default: "🏆" },
            badgeName: { type: String, default: "Champion" },
            certificateTitle: { type: String, default: "Certificate of Excellence" }
        },
        winnerIds: [{
            rank: Number,
            user: { type: Schema.Types.ObjectId, ref: "User" },
            entry: { type: Schema.Types.ObjectId, ref: "ArenaEntry" }
        }]
    },
    {
        timestamps: true
    }
);

// Method to safely return partial info if needed
challengeSchema.methods.checkActive = function () {
    return this.status === 'active' && new Date() < this.endDate;
};

export const Challenge = mongoose.model("Challenge", challengeSchema);
