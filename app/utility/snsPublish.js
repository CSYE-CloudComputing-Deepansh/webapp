const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: process.env.AWS_REGION });

const publishMessage = async (messagePayload) => {
    const params = {
        Message: JSON.stringify(messagePayload),
        TopicArn: process.env.SNS_TOPIC_ARN
    };
    await sns.publish(params).promise();
};

module.exports = { publishMessage };
