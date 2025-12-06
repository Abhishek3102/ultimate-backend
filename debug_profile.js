import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { Subscription } from "./src/models/subscription.model.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/videotube`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

const debugProfile = async () => {
    await connectDB();
    
    // 1. Get IDs
    const badal = await User.findOne({ username: "badalpandey" });
    const wittug = await User.findOne({ username: "wittug" }); // assuming wittug is the username

    if (!badal || !wittug) {
        console.log("Users not found");
        // Try to find ANY subscriber of badal
        const sub = await Subscription.findOne({ channel: badal?._id });
        if (sub) {
             console.log(`Found a subscriber: ${sub.subscriber}`);
             const sUser = await User.findById(sub.subscriber);
             console.log(`Running test with subscriber: ${sUser?.username}`);
             return runAggregation(badal, sUser);
        }
        process.exit(1);
    }
    
    await runAggregation(badal, wittug);
}

async function runAggregation(channel, subscriber) {
    console.log(`\nTesting Aggregation: Channel=${channel.username}, Subscriber=${subscriber.username}`);
    
    const userObjectId = new mongoose.Types.ObjectId(subscriber._id);
    const channelObjectId = new mongoose.Types.ObjectId(channel._id);

    // This mimics the controller logic EXACTLY (without the fix)
    // Note: In the controller it was req.user._id. In mongoose aggregation, types matter.
    
    const pipeline = [
        {
            $match: {
                username: channel.username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                pipeline: [
                     { $match: { status: "accepted" } }
                ],
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                pipeline: [
                    {
                        $match: {
                            subscriber: subscriber._id // Passing raw ID (mimics potential issue if not cast)
                        }
                    }
                ],
                as: "mySubscription" 
            }
        },
        {
            $addFields: {
                isSubscribed: {
                    $cond: {
                        if: { 
                            $eq: [
                                { $arrayElemAt: ["$mySubscription.status", 0] },
                                "accepted" 
                            ] 
                        },
                        then: true,
                        else: false
                    }
                },
                mySubRaw: "$mySubscription"
            }
        },
        {
             $project: {
                 username: 1,
                 isSubscribed: 1,
                 mySubRaw: 1
             }
        }
    ];

    const result = await User.aggregate(pipeline);
    console.log("Result (Raw ID):", JSON.stringify(result[0], null, 2));

    // Now test with Casted ID
    const pipelineCasted = [...pipeline];
    pipelineCasted[2] = {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                pipeline: [
                    {
                        $match: {
                            subscriber: userObjectId // CASTED
                        }
                    }
                ],
                as: "mySubscription" 
            }
    };

    const resultCasted = await User.aggregate(pipelineCasted);
    console.log("Result (Casted ID):", JSON.stringify(resultCasted[0], null, 2));
    
    process.exit(0);
}

debugProfile();
