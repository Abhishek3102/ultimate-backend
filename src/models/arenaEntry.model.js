import mongoose, { Schema } from "mongoose";

const arenaEntrySchema = new Schema(
    {
        challengeId: {
            type: Schema.Types.ObjectId,
            ref: "Challenge",
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // We can link to existing types (Tweet/Video) OR have direct content
        // For simplicity, let's link to existing Post types if the platform is unified, 
        // but often challenges have specific content. Let's make it flexible.
        contentId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'contentType' 
        },
        contentType: {
            type: String,
            required: true,
            enum: ['Tweet', 'Video', 'Image'] 
        },
        certificateName: {
            type: String,
            required: true,
            trim: true
        },
        votes: {
            type: Number,
            default: 0,
            index: -1 // High votes is better
        },
        voters: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    {
        timestamps: true
    }
);

// Ensure user can only submit once per challenge?
arenaEntrySchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export const ArenaEntry = mongoose.model("ArenaEntry", arenaEntrySchema);
