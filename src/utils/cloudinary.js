import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config"
import { log } from "console";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("on upload cloudinary!!")
    // console.log(localFilePath);
    if (!localFilePath) {
      console.log("local file path doesn't exist:: ", localFilePath);
      return null;
    }
    // upload the file on cloudinary
    // console.log("before response")
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    // console.log("file is uploaded on cloudinary", response.secure_url);
    // console.log(response)
    fs.unlinkSync(localFilePath)
    return response;
  } catch (err) {
    console.log("error on cloudinary upload:",err);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file on the upload operation get failed.
    return null;
  }
};

export { uploadOnCloudinary };

// cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function(error, result) {console.log(result); });
