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
        required: true
    },
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
