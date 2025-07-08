const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getImages = async () => {
  let allImages = [];
  let nextCursor = null;
  // cloudinary는 한번에 최대 500개의 데이터를 가져올 수 있어서
  // 한번에 500개 가져오고 do - while 문을 이용해서, 다음 500개가 존재하면 또 가져온다.

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

  // 간단하게 추려지지 않은 allImages 데이터 중 필요한 값들만 뽑아준다.
  const imageData = allImages.map((img) => ({
    public_id: img.public_id,
    url: img.secure_url,
    width: img.width,
    height: img.height,
    created_at: img.created_at,
  }));

  const payload = {
    updated_at: new Date().toISOString(),
    images: imageData,
  };

  fs.writeFileSync("data/images.json", JSON.stringify(payload, null, 2));

  console.log(`총 ${imageData.length}개 이미지 업데이트 완료`);
};

getImages().catch(console.error);
