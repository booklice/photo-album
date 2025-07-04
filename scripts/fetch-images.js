// scripts/fetch-images.js
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const DATA_PATH = "data/images.json";
const FOLDER = "coffee";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fetchAllImages = async () => {
  const existing = fs.existsSync(DATA_PATH)
    ? JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")).images || []
    : [];

  const existingIds = new Set(existing.map((img) => img.public_id));
  const allIds = [];
  let nextCursor = null;

  console.log("이미지 목록 가져오는 중...");

  do {
    const res = await cloudinary.search
      .expression(`folder:${FOLDER}`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .next_cursor(nextCursor)
      .execute();

    allIds.push(...res.resources.map((r) => r.public_id));
    nextCursor = res.next_cursor;
  } while (nextCursor);

  const newIds = allIds.filter((id) => !existingIds.has(id));
  console.log(`새 이미지 ${newIds.length}개`);

  const newImages = [];

  for (const id of newIds) {
    try {
      const res = await cloudinary.api.resource(id, {
        image_metadata: true,
        metadata: true,
      });

      const exif = res.image_metadata?.DateTimeOriginal || res.image_metadata?.DateTime;
      const takenAt = res.metadata?.taken_at || (exif?.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3").replace(" ", "T") || null);

      newImages.push({
        public_id: res.public_id,
        url: res.secure_url,
        width: res.width,
        height: res.height,
        created_at: res.created_at,
        taken_at,
      });

      console.log(`${id} → taken_at: ${takenAt || "없음"}`);
    } catch (err) {
      console.error(`${id} 실패:`, err.message);
    }
  }

  if (!fs.existsSync("data")) fs.mkdirSync("data");

  fs.writeFileSync(DATA_PATH, JSON.stringify({
    updated_at: new Date().toISOString(),
    images: [...newImages, ...existing],
  }, null, 2));

  console.log(`저장 완료: 총 ${newImages.length}개 추가 (전체 ${newImages.length + existing.length}개)`);
}

fetchAllImages().catch(console.error);


