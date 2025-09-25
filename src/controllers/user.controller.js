const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const validator = require("validator");
const User = require("../models/user.model");
const uploadOnCloudinary = require("../utils/cloudinary.js");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessTokens();
    const refreshToken = user.generateRefreshTokens();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: true });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genearating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, age, gender, about } = req.body;

  const skills = JSON.parse(req.body.skills);

  if (!Array.isArray(skills)) {
    throw new ApiError(400, "Skills must be an array");
  }

  if (!firstName) {
    throw new ApiError(401, "Enter a valid First name ");
  } else if (!validator.isEmail(email)) {
    throw new ApiError(401, "Enter a valid email");
  } else if (!validator.isStrongPassword(password)) {
    throw new ApiError(401, "Enter a valid password");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User already existed with this email");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(409, "Profile Image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(409, "Profile Image is required");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    age,
    gender,
    about,
    skills,
    avatar: avatar.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(409, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(401, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(409, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new ApiError(409, "Something went wrong while Logged in the user");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, refreshToken: newRefreshToken })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword, email } = req.body;

  if (!validator.isStrongPassword(newPassword)) {
    throw new ApiError(401, "Enter a valid Strong Password");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(401, "Password does not match");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "User does not exist with this email");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password -refreshToken");
  if (!users) {
    throw new ApiError(401, "Users not Found");
  }

  return res.status(201).json(new ApiResponse(200, users));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "User not Found");
  }

  return res.status(201).json(new ApiResponse(200, user));
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { lastName, age, gender, about, skills } = req.body;

  const userId = req.params.id;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        lastName,
        age,
        gender,
        about,
        skills,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar File is required");
  }

  const avatar = uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(401, "Something getting wrong while uploading avatar");
  }

  const updateAvatar = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(200, updateAvatar, "Avatar Updated Successfully"));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getAllUsers,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
};
