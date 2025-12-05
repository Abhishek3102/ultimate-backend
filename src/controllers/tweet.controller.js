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

  // Create tweet in DB with owner as the logged-in user
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  return res.status(201).json(
    new ApiResponse(201, tweet, "Tweet created successfully")
  );
});

// ✅ Get all tweets from the logged-in user
// ✅ Get all tweets from the logged-in user
const getUserTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: req.user._id,
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
      },
    },
    {
        $project: {
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
    new ApiResponse(200, tweets, "User tweets fetched successfully")
  );
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

export {
  createTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
  deleteTweet
};
