import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token || typeof token !== "string") {
          throw new ApiError(
            401,
            "Unauthorized access: Token missing or invalid"
          );
        }
        const decodedPayload = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findOne({ _id: decodedPayload._id }).select(
          "-password -refreshtoken"
        );
    
        if (!user) {
          throw new ApiError(401, "Invalid access token");
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid accesstoken")
    }
})

export {verifyJWT}