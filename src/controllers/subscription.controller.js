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
    // Already subscribed – so unsubscribe
    await existingSub.deleteOne();
    return res.status(200).json(
      new ApiResponse(200, null, "Unsubscribed from channel successfully")
    );
  }

  // Else, subscribe
  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res.status(201).json(
    new ApiResponse(201, null, "Subscribed to channel successfully")
  );
});

// ✅ Get all users who have subscribed to a given channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Find all subscribers for the given channel
  const subscribers = await Subscription.find({ channel: channelId })
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

  const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "fullName avatar username")
    .select("channel createdAt");

  return res.status(200).json(
    new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
  );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};
