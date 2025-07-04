// scripts/fetch-images.js
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchAllImages() {
  let publicIds = [];
  let nextCursor = null;

  console.log("🔍 Cloudinary에서 이미지 목록 가져오는 중...");

  do {
    const result = await cloudinary.search
      .expression("folder:coffee")
      .sort_by("created_at", "desc")
      .max_results(100)
      .next_cursor(nextCursor)
      .execute();

    publicIds.push(...result.resources.map((r) => r.public_id));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log(`총 ${publicIds.length}개 이미지 발견`);

  const imageData = [];

  for (const publicId of publicIds) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        image_metadata: true,
        metadata: true,
      });

      const dateTimeExif = result.image_metadata?.DateTimeOriginal || result.image_metadata?.DateTime;
      const structuredTakenAt = result.metadata?.taken_at;

      let takenAt = null;

      if (structuredTakenAt) {
        takenAt = structuredTakenAt;
      } else if (dateTimeExif) {
        // EXIF: "2025:05:31 08:33:45" → ISO8601
        takenAt = dateTimeExif.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3").replace(" ", "T");
      }

      imageData.push({
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        created_at: result.created_at,
        taken_at: takenAt,
      });

      console.log(`📝 ${publicId} → taken_at: ${takenAt || "없음"}`);
    } catch (err) {
      console.error(`⚠️ ${publicId} 메타데이터 조회 실패:`, err.message);
    }
  }

  if (!fs.existsSync("data")) fs.mkdirSync("data");

  const payload = {
    updated_at: new Date().toISOString(),
    images: imageData,
  };

  fs.writeFileSync("data/images.json", JSON.stringify(payload, null, 2));
  console.log(`총 ${imageData.length}개 이미지 저장 완료`);
}

fetchAllImages().catch(console.error);

