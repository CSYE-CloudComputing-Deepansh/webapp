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

//find user by id
const findUserById = async (userID) => {
  try {
    const user = await Users.findOne({ where: { id: userID } });
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
const saveProfilePic = async (files, req, res) => {
    const start = Date.now();
    try {
        //const user = req.user;
        //const userId = user.id;  // Ensure we have user ID
        const file = files;

        if (!file) {
            recordMetric('api.saveProfilePic.failure');
            return;
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

        const imageRecord = await Image.create(imageMetadata);

        recordMetric('api.saveProfilePic.success');
        const duration = Date.now() - start;
        recordMetric('api.saveProfilePic.duration', duration, 'timing');

        return imageRecord;
    } catch (error) {
        recordMetric('api.saveProfilePic.failure');
        throw error;
    }
};



// Get image metadata for a user
const getImage = async (filter) => {
  try {
    // Fetch image metadata from database
    const image = await Image.findOne({ where: {user_id: filter.user_id} });
    if (!image) {
      recordMetric('api.getProfilePic.failure');
      return;
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


const getImageForDelete = async (filter) => {
    try {
      // Fetch image metadata from database
      const image = await Image.findOne({ where: {user_id: filter.user_id} });
      if (!image) {
        recordMetric('api.getProfilePic.failure');
        return;
      }

      return image;
  
    } catch (error) {
      logger.error(`Error fetching image: ${error.message}`);
      recordMetric('db.getImage.failure'); // Increment failure metric for image fetch
      throw error;
    }
  };
// Delete image metadata from the database and S3 bucket
const deleteImage = async (imageS3) => {
  try {
    const image = await Image.findOne({ where: { id: imageS3.id } });
    if (!image) {
      throw new Error("Image not found");
    }

    // Delete image from S3 bucket
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: imageS3.file_name,
    }).promise();

    // Delete image record from database
    await Image.destroy({ where: { id: imageS3.id  } });

    logger.info(`Image deleted for user: ${imageS3.user_id}`);
    recordMetric('db.deleteImage.success'); // Increment success metric for image delete
  } catch (error) {
    logger.error(`Error deleting image: ${error.message}`);
    recordMetric('db.deleteImage.failure'); // Increment failure metric for image delete
    throw error;
  }
};

const updateUserVerification = async (userId) => {
  await Users.update({ is_verified: true }, { where: { id: userId } });
};

module.exports = { saveUser, findUser, verifyPassword, saveProfilePic, getImage, deleteImage, getImageForDelete, updateUserVerification, findUserById };
