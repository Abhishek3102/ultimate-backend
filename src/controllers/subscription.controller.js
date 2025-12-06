/*
import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
*/

import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Toggle subscription between current user and target channel
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Ensure the channel ID is valid
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Prevent subscribing to self
  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSub = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSub) {
    // Already subscribed – so unsubscribe/withdraw request
    await existingSub.deleteOne();
    return res.status(200).json(
      new ApiResponse(200, null, "Unsubscribed/Request withdrawn successfully")
    );
  }

  // Check if channel user is private
  const channelUser = await User.findById(channelId);
  if(!channelUser){
    throw new ApiError(404, "Channel not found");
  }

  const status = channelUser.isPrivate ? "pending" : "accepted";

  // Else, subscribe
  const newSub = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
    status
  });

  const message = status === "pending" ? "Follow request sent" : "Subscribed successfully";

  return res.status(201).json(
    new ApiResponse(201, { status : newSub.status }, message)
  );
});

// ✅ Get all users who have subscribed to a given channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Find all subscribers for the given channel
  const subscribers = await Subscription.find({ 
      channel: channelId, 
      status: "accepted" 
    })
    .populate("subscriber", "fullName avatar username")
    .select("subscriber createdAt");

  return res.status(200).json(
    new ApiResponse(200, subscribers, "Channel subscribers fetched successfully")
  );
});

// ✅ Get all channels that a user (subscriber) has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const subscribedChannels = await Subscription.find({ 
      subscriber: subscriberId,
      status: "accepted"
    })
    .populate("channel", "fullName avatar username")
    .select("channel createdAt");

  return res.status(200).json(
    new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
  );
});

// ✅ Get pending follow requests for the current user
const getFollowRequests = asyncHandler(async (req, res) => {
    const requests = await Subscription.find({
        channel: req.user._id,
        status: "pending"
    }).populate("subscriber", "fullName avatar username")
    .select("subscriber createdAt");

    return res.status(200).json(
        new ApiResponse(200, requests, "Follow requests fetched successfully")
    );
});

// ✅ Respond to follow request (Accept/Reject)
const respondToFollowRequest = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const { action } = req.body; // "accept" or "reject"  

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    if (!["accept", "reject"].includes(action)) {
        throw new ApiError(400, "Invalid action. Use 'accept' or 'reject'");
    }

    const request = await Subscription.findOne({
        subscriber: subscriberId,
        channel: req.user._id,
        status: "pending"
    });

    if (!request) {
        throw new ApiError(404, "Follow request not found");
    }

    if (action === "accept") {
        request.status = "accepted";
        await request.save();
        return res.status(200).json(new ApiResponse(200, {}, "Follow request accepted"));
    } else {
        await request.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Follow request rejected"));
    }
});

// ✅ Remove a follower (Force unfollow)
const removeFollower = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscription = await Subscription.findOneAndDelete({
        channel: req.user._id,
        subscriber: subscriberId
    });

    if (!subscription) {
        throw new ApiError(404, "Follower not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Follower removed successfully")
    );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getFollowRequests,
  respondToFollowRequest,
  removeFollower
};
