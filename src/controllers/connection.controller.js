const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/user.model");
const ConnectionRequest = require("../models/connectionRequest.model");

const sentRequest = asyncHandler(async (req, res) => {
  const fromUserId = req.user._id;
  const toUserId = req.params.toUserId;
  const status = req.params.status;

  const allowedStatusType = ["ignored", "interested"];
  if (!allowedStatusType.includes(status)) {
    throw new ApiError(401, "Invalid Status Type");
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new ApiError(401, "User not found");
  }

  const existingConnectionRequest = await ConnectionRequest.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: fromUserId, toUserId: toUserId },
    ],
  });

  if (existingConnectionRequest) {
    throw new ApiError(401, "Connection Request Already existed");
  }

  const connectionRequest = await ConnectionRequest.create({
    fromUserId,
    toUserId,
    status,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, connectionRequest, "Request Sent Successfully")
  );
});

const reviewRequest = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  const requestId = req.params.requestId;
  const status = req.params.status;

  const allowedStatusType = ["rejected", "accepted"];

  if (!allowedStatusType.includes(status)) {
    throw new ApiError(401, "Invalid Status Type");
  }

  const connectionRequest = await ConnectionRequest.findOne({
    _id: requestId,
    toUserId: loggedInUserId,
    status: "interested",
  });

  if (!connectionRequest) {
    throw new ApiError(404, "Connection request not found");
  }

  connectionRequest.status = status;
  const data = await connectionRequest.save();
  return res
    .status(201)
    .json(
      new ApiResponse(200, connectionRequest, `Request ${status} Successfully`)
  );
});

const getRequests = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;

  const status = req.params.status;

  const allowedStatusType = ["interested", "accepted"];

  if (!allowedStatusType.includes(status)) {
    throw new ApiError(401, "Invalid Status Type");
  }

  if (status == "interested") {
    const requests = await ConnectionRequest.findOne({
      toUserId: loggedInUserId,
      status: "interested",
    })
    .populate("fromUserId", "firstName lastName");
    if (!requests) {
      throw new ApiError(404, "No Requests Found");
    }

    return res.status(201).json(new ApiResponse(200, requests));
  } else if (status == "accepted") {
    const requests = await ConnectionRequest.findOne({
      toUserId: loggedInUserId,
      status: "accepted",
    })
      .populate("fromUserId", ["firstName", "lastName"])
      .populate("toUserId", "firstName lastName");
    if (!requests) {
      throw new ApiError(404, "No Requests Found");
    }

    return res.status(201).json(new ApiResponse(200, requests)
    );
  }
});

module.exports = { sentRequest, reviewRequest, getRequests };
