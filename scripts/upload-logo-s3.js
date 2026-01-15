const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

const s3Client = new S3Client({
    forcePathStyle: true,
    region: "us-east-1", // Supabase S3 is region-less but SDK needs one
    endpoint: "https://kucajoobtwptpdanuvnj.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: "8fd567192bee0a77d06bdbbd4817563d",
        secretAccessKey: "f9e9814c40cb60d0ca7d88cbc4740d7298d1a27590204befbf6449490b374742",
    },
});

async function uploadLogo() {
    try {
        const fileContent = fs.readFileSync("C:/Users/nexon/.gemini/antigravity/brain/31aa2a24-3a43-428c-a16c-b178cf99f817/uploaded_image_1768473656573.png");
        const command = new PutObjectCommand({
            Bucket: "public",
            Key: "logo-odillon.png",
            Body: fileContent,
            ContentType: "image/png",
        });

        const data = await s3Client.send(command);
        console.log("Success", data);
    } catch (err) {
        console.error("Error", err);
    }
}

uploadLogo();
