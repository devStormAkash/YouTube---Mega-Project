import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return undefined;
        // upload on cloudinary
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        // file uploaded successfully
        console.log("File uploaded successfully with url : ", uploadResponse.url);
        console.log("Cloudinary Response",uploadResponse);
        return uploadResponse
    } catch (error) {
        fs.unlinkSync(localFilePath);// if uploading on cloudinary got failed then we remove it from our local server
        return null;
    }
}

export {uploadOnCloudinary}