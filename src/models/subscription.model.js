import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "accepted"
    }
}, {timestamps: true})



export const Subscription = mongoose.model("Subscription", subscriptionSchema)