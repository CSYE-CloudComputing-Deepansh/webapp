const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const Users = require('../Model/user-model.js').user;
const Image = require('../Model/image-model.js').image;
const logger = require('../utility/logger.js');
const recordMetric = require('../utility/statsd');

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
const saveImage = async (file, userId) => {
  try {
    // Define S3 parameters for upload
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${userId}/${Date.now()}_${file.originalname}`, // Create a unique key using user ID and timestamp
      Body: file.buffer, // Assuming 'file' is coming from multer middleware
      ContentType: file.mimetype,
      ACL: 'public-read', // Define permissions as needed
    };

    // Upload image to S3
    const s3Response = await s3.upload(params).promise();
    const imageUrl = s3Response.Location;

    // Save image metadata in the database
    const imageMetadata = {
      file_name: params.Key,
      url: imageUrl,
      user_id: userId,
    };

    const image = await Image.create(imageMetadata);
    logger.info(`Image saved to S3 for user: ${userId}`);
    recordMetric('db.saveImage.success'); // Increment success metric for image save

    return image;
  } catch (error) {
    logger.error(`Error saving image: ${error.message}`);
    recordMetric('db.saveImage.failure'); // Increment failure metric for image save
    throw error;
  }
};

// Get image metadata for a user
const getImage = async (filter) => {
  try {
    const image = await Image.findOne({ where: filter });
    if (!image) {
      logger.warn(`Image not found for filter: ${JSON.stringify(filter)}`);
    }
    return image;
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
