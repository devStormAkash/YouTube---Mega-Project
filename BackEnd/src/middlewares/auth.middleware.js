import { User } from "../models/users.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized access")
        }
        const decodedPayload = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findOne(decodedPayload._id).select("-password -refreshtoken")
    
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