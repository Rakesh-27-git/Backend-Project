import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const newTweet = await Tweet.create({
    content,
    user: req.user?.id,
  });
  return res
    .status(201)
    .json(new ApiResponse(200, "Tweet created successfully", newTweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const tweets = await Tweet.find({ user: userId }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, "User tweets retrieved successfully", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  console.log(tweet);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.user.toString() !== req.user?.id) {
    throw new ApiError(403, "Unauthorized");
  }

  tweet.content = content;
  await tweet.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", tweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.user.toString() !== req.user?.id) {
    throw new ApiError(403, "Unauthorized");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse("Tweet deleted successfully", deletedTweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
