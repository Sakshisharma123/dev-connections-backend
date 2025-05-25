const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.model");
const validator = require("validator");
const uploadOnCloudinary = require("../utils/cloudinary.js");

const registerUser = asyncHandler(async (req, res) => {
 
  const { firstName, lastName, email, password, age, gender, about, skills } =
    req.body;

  if (!firstName || !lastName) {
    throw new ApiError(400, "Enter a vaid first or last name");
  } else if (!validator.isEmail(email)) {
    throw new ApiError(400, "Enter a valid Email ID");
  } else if (!validator.isStrongPassword(password)) {
    throw new ApiError(400, "Enter a strong password");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User is already existed with this email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar ficvble is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
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

module.exports = { registerUser };
