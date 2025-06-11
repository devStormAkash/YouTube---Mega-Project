import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.model.js"
import  {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

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


const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken();
        user.refreshtoken = refreshToken
        await user.save({ validateBeforeSave: false })
    
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refreshtoken and accesstoken")
    }

}

const loginuser = asyncHandler(async (req, res) => {
  // Algorithm or steps to login a user
  // 1. Take input feom user - email, username, password
  // 2. validate the inputs from db
  // 3. check if user exists or not
  // 4. if exist then validate user by password
  // 5. generate accesstoken and refreshtoken
  // 6. send tokens in cookie

  // 1. Take input feom user - email, username, password
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }
  // 2. validate the inputs from db
  const loggedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  // 3. check if user exists or not
  if (!loggedUser) {
    throw new ApiError(401, "User not exist ot not registered");
  }

  // 4. if exist then validate user by password
  const isCorrectPasswordByUser = await loggedUser.isPasswordCorrect(password);
  if (!isCorrectPasswordByUser) {
    throw new ApiError(401, "Invalid user credentials -- password");
  }

  // 5. generate accesstoken and refreshtoken
  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshToken(loggedUser._id);

  const loggedinUser = await User.findById(loggedUser._id).select(
    "-password -refreshtoken"
  );
  // 6. send tokens in cookie

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedinUser,
        refreshToken,
        accessToken,
      },"User logged in successfully")
    );
})


const logoutuser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshtoken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure : true

    }

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User loggedout successfully"))
    
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised access")
    }
    const payload = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById({ _id: payload._id })
    if (!user) {
        throw new ApiError(401, "Umauthorised access")
    }
    
    if (incomingRefreshToken !== user.refreshtoken) {
        throw new ApiError(401, "Refresh Token is expired or used")
    }

    const { accessToken, newRefreshToken } = await generateAccessTokenandRefreshToken(user._id)
    const options = {
        httpOnly: true,
        secure : true
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {
            newRefreshToken,
            accessToken
    },"AccessToken refreshed successfully"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword } = req.body
    if (!(confirmPassword === newPassword)) {
        throw new ApiError(400, "New password not matches with Confirmpassword")
    }
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(400 , "No such user exists to change password")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401 , "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req?.user, "Current User Found Successfully"))
    
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body
    if (!(email || fullname)) {
        throw new ApiError(400, "Provide atleast email or fullname to update the account")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullname
            }
        },
        {
            new : true
        }
    ).select("-password")

    
    return res
        .status(200)
        .json(200, user, "Account details updated successfully")
    
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(404 , "File not found to upload")
    }
    const uploadResponse = await uploadOnCloudinary(avatarLocalPath)

    if (!uploadResponse.ulr) {
        throw new ApiError(400, "Error while uploading the avatar image")
    }

    const userAfterUpdatingAvatar = await User.findByIdAndUpdate(
        re.user?._id,
        {
            $set: {
                avatar : uploadResponse.url
            }
        },
        {
        new : true
    }).select("-password")

    return res.
        status(200)
    .json(new ApiResponse(200,userAfterUpdatingAvatar,"Avatar updated successfully" ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(404, "File not found to upload");
  }
  const uploadResponse = await uploadOnCloudinary(coverImageLocalPath);

  if (!uploadResponse.ulr) {
    throw new ApiError(400, "Error while uploading the cover image");
  }

  const userAfterUpdatingCoverImage = await User.findByIdAndUpdate(
    re.user?._id,
    {
      $set: {
        coverImage: uploadResponse.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userAfterUpdatingCoverImage,
        "CoverImage updated successfully"
      )
    );
});


export {
    registerUser,
    loginuser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};