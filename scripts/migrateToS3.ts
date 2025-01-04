import mongoose from 'mongoose';
import { config } from 'dotenv';
import AWS from 'aws-sdk';
import { VisionBoard } from '../src/models/VisionBoard';

// Load environment variables
config();

// Configure AWS
const s3Client = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

async function uploadToS3(base64Image: string, fileName: string): Promise<string> {
  // Remove the data:image/png;base64, prefix if it exists
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const params = {
    Bucket: BUCKET_NAME,
    Key: `vision-boards/${fileName}`,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'bucket-owner-full-control',
  };

  return new Promise((resolve, reject) => {
    s3Client.upload(params, async (err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        // Generate presigned URL
        const preSignedOption = {
          Bucket: BUCKET_NAME,
          Key: params.Key,
          Expires: 604800, // 7 days
        };
        const url = await s3Client.getSignedUrlPromise('getObject', preSignedOption);
        resolve(url);
      }
    });
  });
}

async function migrateImages() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all vision boards with base64 images
    const visionBoards = await VisionBoard.find({
      $or: [
        { imageUrl: { $regex: '^data:image\/.*base64' } },
        { base64Image: { $exists: true } }
      ]
    });

    console.log(`Found ${visionBoards.length} vision boards to migrate`);

    // Process each vision board
    for (const board of visionBoards) {
      try {
        const base64Image = board.imageUrl;
        if (!base64Image.startsWith('data:image')) {
          console.log(`Skipping board ${board._id} - no base64 image found`);
          continue;
        }

        console.log(`Processing board ${board._id}`);
        const fileName = `${board._id}-${Date.now()}.png`;
        const s3Url = await uploadToS3(base64Image, fileName);

        // Update the document
        await VisionBoard.findByIdAndUpdate(board._id, {
          imageUrl: s3Url,
          $unset: { base64Image: "" }  // Remove base64Image field if it exists
        });

        console.log(`Successfully migrated board ${board._id}`);
      } catch (error) {
        console.error(`Error processing board ${board._id}:`, error);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateImages(); 