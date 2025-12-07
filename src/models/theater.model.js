import mongoose, { Schema } from "mongoose";

const theaterSchema = new Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            default: "Watch Party"
        },
        host: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export const Theater = mongoose.model("Theater", theaterSchema);
