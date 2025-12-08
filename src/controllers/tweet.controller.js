/*
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
*/

import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const isValidObjectId = mongoose.isValidObjectId;

// ✅ Get all tweets (Feed)
// ✅ Get all tweets (Feed)
const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        owner: {
          $first: "$ownerDetails",
        },
      },
    },
    {
        $project: {
            ownerDetails: 0,
            likes: 0,
            comments: 0
        }
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, tweets, "Tweets fetched successfully")
  );
});

// ✅ Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // Check if content exists
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  // Extract hashtags
  const hashtags = content.match(/#[a-z0-9_\-]+/gi) || [];

  // Create tweet in DB with owner as the logged-in user
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
    hashtags
  });

  return res.status(201).json(
    new ApiResponse(201, tweet, "Tweet created successfully")
  );
});

// ✅ Get tweets for a specific channel/user (with privacy check)
const getChannelTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Expect userId in params

  if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
  }

  const user = await User.findById(userId);
  if (!user) {
      throw new ApiError(404, "User not found");
  }

  // Privacy Check
  if (user.isPrivate) {
      if (!req.user || req.user._id.toString() !== userId.toString()) {
           const isSubscribed = await mongoose.model("Subscription").findOne({
               subscriber: req.user?._id,
               channel: userId,
               status: "accepted"
           });
           if (!isSubscribed) {
               return res.status(200).json(new ApiResponse(200, [], "User is private"));
           }
      }
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        isLiked: {
             $cond: {
                 if: { $in: [req.user?._id, "$likes.likedBy"] },
                 then: true,
                 else: false
             }
        },
        owner: {
          $first: "$ownerDetails",
        },
      },
    },
    {
        $project: {
            likes: 0,
            comments: 0,
            ownerDetails: 0
        }
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, tweets, "Tweets fetched successfully")
  );
});

// ✅ Get all tweets from the logged-in user (Helper for convenience, or deprecated)
const getUserTweets = asyncHandler(async (req, res) => {
    // Redirect to getChannelTweets with logged in user id
    req.params.userId = req.user._id;
    return getChannelTweets(req, res);
});

// ✅ Update a tweet by ID
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  // Validate tweet ID and content
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Ensure only the owner can update
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  tweet.content = content;
  await tweet.save();

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet updated successfully")
  );
});

// ✅ Delete a tweet by ID
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Ensure only the owner can delete
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  await tweet.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Tweet deleted successfully")
  );
});

// ✅ Get a single tweet by ID
const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        isLiked: {
             $cond: {
                 if: { $in: [req.user?._id, "$likes.likedBy"] },
                 then: true,
                 else: false
             }
        },
        owner: {
          $first: "$ownerDetails",
        },
      },
    },
    {
        $project: {
            likes: 0,
            comments: 0,
            ownerDetails: 0
        }
    }
  ]);

  if (!tweets?.length) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(
    new ApiResponse(200, tweets[0], "Tweet fetched successfully")
  );
});

export {
  createTweet,
  getAllTweets,
  getUserTweets,
  getChannelTweets,
  updateTweet,
  deleteTweet,
  getTweetById
};
