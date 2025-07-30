const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getImages = async () => {
  let allImages = [];
  let nextCursor = null;

  do {
    const result = await cloudinary.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER_NAME}`)
      .sort_by("created_at", "desc")
      .fields("context")
      .fields("image_metadata")
      .fields("secure_url")
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    allImages = [...allImages, ...result.resources];
    nextCursor = result.next_cursor;
  } while (nextCursor);

  const data = {
    updated_at: new Date().toISOString(),
    images: allImages.map((img) => {
      return {
        public_id: img.public_id,
        url: img.secure_url,
        width: img.width,
        height: img.height,
        created_at: img.created_at,
        taken_at: img.image_metadata?.DateTimeOriginal || null,
        title: img.context?.caption || null,
        alt: img.context?.alt || null,
        // 커스톰1: img.context?.커스톰1 || null
      };
    }),
  };

  const fileDiretory = path.dirname("data/images.json");

  if (!fs.existsSync(fileDiretory)) {
    fs.mkdirSync(fileDiretory, { recursive: true });
  }

  fs.writeFileSync("data/images.json", JSON.stringify(data, null, 2));
  console.log(`가져온 이미지 총 ${allImages.length}개`);
};

getImages().catch(console.error);
