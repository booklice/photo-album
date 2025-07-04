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
      .sort_by("created_at", "desc")
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    allImages = [...allImages, ...result.resources];
    nextCursor = result.next_cursor;
  } while (nextCursor);

  // 필요한 정보만 추출
  const imageData = allImages.map((img) => ({
    public_id: img.public_id,
    url: img.secure_url,
    width: img.width,
    height: img.height,
    created_at: img.created_at,
  }));

  // data 폴더가 없으면 생성
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }

  const payload = {
    updated_at: new Date().toISOString(),
    images: imageData
  };

  fs.writeFileSync('data/images.json', JSON.stringify(payload, null, 2));

  console.log(총 ${imageData.length}개 이미지 업데이트 완료);
}

fetchAllImages().catch(console.error);



