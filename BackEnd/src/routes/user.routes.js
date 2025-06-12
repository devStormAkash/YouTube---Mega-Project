import { Router } from "express"
import { changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginuser, 
    logoutuser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleaware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()
router.route("/register").post(upload.fields([
    {   name:"avatar",
        maxCount:1
    },
    {   name : "coverImage",
        maxCount : 1
    }]), registerUser)

router.route("/login").post(loginuser)
    
// Secured Routes
router.route("/logout").post(verifyJWT, logoutuser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

  
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watchHistory").get(verifyJWT, getWatchHistory)




export default router