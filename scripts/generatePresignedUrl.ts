import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const s3Client = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

async function generatePresignedUrl(objectKey: string): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Expires: 94608000, // 3 years in seconds (3 * 365 * 24 * 60 * 60)
  };

  try {
    const url = await s3Client.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

// Check if object key is provided as command line argument
const objectKey = process.argv[2];
if (!objectKey) {
  console.error('Please provide an object key as a command line argument');
  process.exit(1);
}

// Generate and display the presigned URL
generatePresignedUrl(objectKey)
  .then(url => {
    console.log('Presigned URL (valid for 3 years):');
    console.log(url);
  })
  .catch(error => {
    console.error('Failed to generate presigned URL:', error);
    process.exit(1);
  }); 