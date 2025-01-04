import AWS from 'aws-sdk';
import axios from 'axios';
import sharp from 'sharp';

const s3Client = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

export const uploadImageToS3 = async (imageUrl: string, fileName: string): Promise<string> => {
  try {
    // Download image from OpenAI URL
    console.time('Downloading image from OpenAI URL');
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    console.timeEnd('Downloading image from OpenAI URL');

    // Optimize image using Sharp
    console.time('Optimizing image');
    const optimizedBuffer = await sharp(buffer)
      .png({ compressionLevel: 9 })
      .toBuffer();
    console.timeEnd('Optimizing image');

    // Upload to S3 with public-read ACL
    const params = {
      Bucket: BUCKET_NAME,
      Key: `vision-boards/${fileName}`,
      Body: optimizedBuffer,
      ContentType: 'image/png',
      ACL: 'bucket-owner-full-control', // This makes the object publicly accessible
    };

    return new Promise((resolve, reject) => {
      s3Client.upload(params, async(err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          let result = await getPresignedUrl(params.Key, BUCKET_NAME)
          resolve(result)
        }
      });
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}; 

export const getPresignedUrl = async (key: string, bucket: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let preSignedOption = {
      Bucket: bucket,
      Key: key,
      Expires: 604800, // 7 days
    };
    s3Client.getSignedUrlPromise('getObject', preSignedOption).then(function (url) {
      resolve(url)
    }).catch((err) => {
      reject(err);
    })
  })
};