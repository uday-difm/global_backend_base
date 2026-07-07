import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Uploads a file to an S3-compatible bucket.
 * @param {string} folder - The destination folder in the bucket
 * @param {Object} file - File object containing originalname, buffer, and mimetype
 * @returns {Promise<string>} The uploaded file URL
 */
export async function uploadToS3(folder, file) {
  const accessKeyId = process.env.ACCESSKEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRETKEY || process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.BUCKET || process.env.AWS_BUCKET_NAME;
  const region = process.env.REGION || process.env.AWS_REGION || "us-east-1";
  const endpoint = process.env.ENDPOINT || process.env.AWS_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("S3 credentials not fully configured in environment variables");
  }

  const s3Config = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  if (endpoint) {
    s3Config.endpoint = endpoint;
    s3Config.forcePathStyle = true; // Required for many S3-compatible providers
  }

  const s3Client = new S3Client(s3Config);

  const fileExtension = file.originalname.split(".").pop();
  const uniqueFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    })
  );

  if (endpoint) {
    const cleanedEndpoint = endpoint.replace(/^https?:\/\//, "");
    return `https://${bucket}.${cleanedEndpoint}/${uniqueFileName}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${uniqueFileName}`;
}
