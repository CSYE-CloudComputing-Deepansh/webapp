const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const Users = require('../Model/user-model.js').user;
const Image = require('../Model/image-model.js').image;
const logger = require('../utility/logger.js');
const recordMetric = require('../utility/statsd');
const { getUser } = require('../controllers/user-controller.js');

// Configure S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

// Save a new user
const saveUser = async (userData) => {
  try {
    const user = await Users.create(userData);
    logger.info(`User created: ${user.email}`);
    return user;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    throw error;
  }
};

// Find a user by email
const findUser = async (email) => {
  try {
    const user = await Users.findOne({ where: { email } });
    return user;
  } catch (error) {
    logger.error(`Error finding user by email: ${error.message}`);
    throw error;
  }
};

// Verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error(`Error verifying password: ${error.message}`);
    throw error;
  }
};

// Save image to S3 and metadata to the database
const saveProfilePic = async (req, res) => {
    const start = Date.now();
    try {
        const user = req.user;
        //const userId = user.id;  // Ensure we have user ID
        const file = req.file;

        if (!file) {
            recordMetric('api.saveProfilePic.failure');
            return res.status(400).json({ message: "No file uploaded" });
        }

        const authHeader = req.get('authorization');
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');
        const userFind = await findUser(email);
        // Construct S3 parameters and upload
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${userFind.id}/${Date.now()}_${file.originalname}`,  // Unique key for each file
            Body: file.buffer,
            ContentType: file.mimetype
        };

        const s3Response = await s3.upload(params).promise();
        const imageUrl = s3Response.Location;

        // Save image metadata in the database
        const imageMetadata = {
            file_name: params.Key,     // Use S3 key as filename
            url: imageUrl,             // URL of the uploaded image
            user_id: userFind.id,           // Associate with the user's ID
            upload_date: new Date()    // Optional: override if needed
        };

        const imageRecord = await userService.saveImage(imageMetadata);

        recordMetric('api.saveProfilePic.success');
        const duration = Date.now() - start;
        recordMetric('api.saveProfilePic.duration', duration, 'timing');

        return res.status(201).json({ message: "Profile picture uploaded", image: imageRecord });
    } catch (error) {
        recordMetric('api.saveProfilePic.failure');
        return res.status(500).json({ message: "Error uploading profile picture", error: error.message });
    }
};




// Get image metadata for a user
const getImage = async (filter) => {
  try {
    const authHeader = req.get('authorization');
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email] = credentials.split(':'); // Extract email

    // Fetch user by email
    const user = await userService.findUser(email);
    if (!user) {
      recordMetric('api.getProfilePic.failure');
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch image metadata from database
    const image = await getImage({ user_id: user.id });
    if (!image) {
      recordMetric('api.getProfilePic.failure');
      return res.status(404).json({ message: "Profile picture not found" });
    }

    // Fetch image from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: image.file_name
    };

    const s3Data = await s3.getObject(params).promise();
    return s3Data;
    
  } catch (error) {
    logger.error(`Error fetching image: ${error.message}`);
    recordMetric('db.getImage.failure'); // Increment failure metric for image fetch
    throw error;
  }
};

// Delete image metadata from the database and S3 bucket
const deleteImage = async (imageId) => {
  try {
    const image = await Image.findOne({ where: { id: imageId } });
    if (!image) {
      throw new Error("Image not found");
    }

    // Delete image from S3 bucket
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: image.file_name,
    }).promise();

    // Delete image record from database
    await Image.destroy({ where: { id: imageId } });

    logger.info(`Image deleted for user: ${image.user_id}`);
    recordMetric('db.deleteImage.success'); // Increment success metric for image delete
  } catch (error) {
    logger.error(`Error deleting image: ${error.message}`);
    recordMetric('db.deleteImage.failure'); // Increment failure metric for image delete
    throw error;
  }
};

module.exports = { saveUser, findUser, verifyPassword, saveImage, getImage, deleteImage };
