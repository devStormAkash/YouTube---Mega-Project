import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.model.js"
import  {uploadOnCloudinary} from "../utils/cloudinary.js"


const registerUser = asyncHandler(async (req, res) => {
  // Algorithm to register the user
  // 1. Take input from the user
  // 2. Check if any field is empty
  // 3. Check if username and email is already exists
  // 4. Upload avatar and Coverimage to cloudinary, check for avatar
  // 5. create an user object and save it to thje database
  // 6. REMOVE THE PASSWORD and REFRESH TOKEN field from thne respose
  // 7. Check for the user object is created or not
  // 8. Return the respose

  // 1. Take input from the user
  const { email, username, fullname, password } = req.body;
  console.log("email", email);

  // 2. Check if any field is empty
  if (
    [email, username, fullname, password].some(
      (element) => element?.trim() === ""
    )
  ) {
    throw new ApiError(400, "Error : All fields are required");
  }

  // 3. Check if username and email is already exists
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (user) {
    throw new ApiError(
      401,
      "Error : User is already exist with same email or username"
    );
  }

  // 4. Upload avatar and Coverimage to cloudinary, check for avatar
  const avatarLocalPath = req.files?.avatar[0].path;
  // check if coverimage present or not , if present then only take the cover image
  let coverImageLocalPath;
  if (req.files.coverImage) coverImageLocalPath = req.files.coverImage[0].path;
  else coverImageLocalPath = "";

  // check if avatar path is loaded successfully
  if (!avatarLocalPath) throw new ApiError(406, "Avatar file is required");

  // upload avatar on cloudinary
  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);

  // upload coverimage on cloudinary

  let coverImageResponse = null;
  if (coverImageLocalPath) {
    coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
  }
  if (!avatarResponse)
    throw new ApiError(500, "Failed to Upload the avatar image");

    
    
  // 5. create an user object and save it to thje database
  const userObject = await User.create({
    fullname,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatarResponse.url,
    coverImage: coverImageResponse === null ? "" : coverImageResponse.url,
  });
    
    
    
  // 6. REMOVE THE PASSWORD and REFRESH TOKEN field from thne respose
  const verifiedUserObject = await User.findById(userObject._id).select(
    "-password -refreshtoken"
    );
    


  // 7. Check for the user object is created or not
  if (!verifiedUserObject)
    throw new ApiError(
      500,
      "Failed to save the data in database at the time of registering"
    );


console.log(req.body);


  // 8. Return the respose

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        verifiedUserObject,
        "New User Registered successfully"
      )
    );
})

export { registerUser };