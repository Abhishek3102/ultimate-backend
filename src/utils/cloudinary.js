import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) return null
        
        // Define upload options based on resource type
        const options = {
            resource_type: resourceType
        };

        // Add compression for videos
        if (resourceType === "video") {
             options.transformation = [
                { quality: "auto:good", fetch_format: "auto" }, // Intelligent compression
                { bit_rate: "500k" } // Limit bitrate
             ];
        }

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, options)
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}