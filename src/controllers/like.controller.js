import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const like = await Like.findOne({ video: videoId, user: user.id });

  if (like) {
    await Like.findByIdAndDelete(like.id);
    video.likes = video.likes - 1;
  } else {
    await Like.create({ video: videoId, user: user.id });
    video.likes = video.likes + 1;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Like updated successfully", video));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const like = await Like.findOne({ comment: commentId, user: user.id });

  if (like) {
    await Like.findByIdAndDelete(like.id);
    comment.likes = comment.likes - 1;
  } else {
    await Like.create({ comment: commentId, user: user.id });
    comment.likes = comment.likes + 1;
  }

  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Like updated successfully", comment));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const like = await Like.findOne({ tweet: tweetId, user: user.id });

  if (like) {
    await Like.findByIdAndDelete(like.id);
    tweet.likes = tweet.likes - 1;
  } else {
    await Like.create({ tweet: tweetId, user: user.id });
    tweet.likes = tweet.likes + 1;
  }

  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Like updated successfully", tweet));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const likes = await Like.find({ user: user.id }).populate("video");

  const videos = likes.map((like) => like.video);

  return res
    .status(200)
    .json(new ApiResponse(200, "Liked videos retrieved successfully", videos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
