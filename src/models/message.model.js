import mongoose, {Schema} from "mongoose";

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    content: {
        type: String,
        // Content is required only if no audioUrl
    },
    audioUrl: {
        type: String // Cloudinary URL
    },
    readBy: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
