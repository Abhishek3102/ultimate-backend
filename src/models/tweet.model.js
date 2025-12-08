import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    hashtags: [String],
    prism_data: {
        sentiment: {
            type: String,
            enum: ['pro', 'anti', 'neutral'],
        },
        rationality_score: Number,
        topic: String,
        category: {
            type: String,
            enum: ['Tech', 'Sports', 'Finance', 'Health', 'Politics', 'Entertainment', 'Other'],
            default: 'Other'
        }
    }
}, {timestamps: true})


export const Tweet = mongoose.model("Tweet", tweetSchema)