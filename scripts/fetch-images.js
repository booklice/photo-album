// scripts/fetch-images.js
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchAllImages() {
  let allImages = [];
  let nextCursor = null;

  do {
    const result = await cloudinary.search
      .expression("folder:coffee")
      .with_field("image_metadata")
      .sort_by("created_at", "desc")
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    allImages = [...allImages, ...result.resources];
    nextCursor = result.next_cursor;
  } while (nextCursor);

  const imageData = allImages.map((img) => {
    const takenAtRaw = img.image_metadata?.DateTime; // "2025:05:31 08:33:45"
    let takenAt = null;

    if (takenAtRaw) {
      // "2025:05:31 08:33:45" -> "2025-05-31T08:33:45"
      takenAt = takenAtRaw.replace(/:/, '-').replace(/:/, '-').replace(" ", "T");
    }

    return {
      public_id: img.public_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      created_at: img.created_at,
      taken_at: takenAt,
    };
  });

  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }

  const payload = {
    updated_at: new Date().toISOString(),
    images: imageData
  };

  fs.writeFileSync('data/images.json', JSON.stringify(payload, null, 2));

  console.log(`총 ${imageData.length}개 이미지 업데이트 완료`);
}

fetchAllImages().catch(console.error);
