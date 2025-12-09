import mongoose, { Schema } from "mongoose";

const canvasNodeSchema = new Schema({
    id: { type: String, required: true }, // UUID from frontend
    type: { type: String, enum: ['video', 'tweet', 'playlist', 'note', 'image'], required: true },
    contentId: { type: Schema.Types.Mixed, default: null }, // Flexible ID (String or null)
    position: { 
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    scale: { type: Number, default: 1 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 1 },
    data: { type: Schema.Types.Mixed, default: {} } // Allow any metadata
}, { _id: false });

const spaceSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        owner: { type: Schema.Types.ObjectId, ref: "User" },
        isPublic: { type: Boolean, default: true },
        members: [{ type: Schema.Types.ObjectId, ref: "User" }],
        backgroundUrl: { type: String, default: null },
        canvasState: [canvasNodeSchema],
        connections: { type: Array, default: [] } // Flexible connections array
    },
    { timestamps: true }
);

export const Space = mongoose.models.Space || mongoose.model("Space", spaceSchema);
