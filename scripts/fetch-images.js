const cloudinary = require("cloudinary").v2;
const fs = require("fs"); // 파일을 입출력 할 때 필요
const path = require("path"); // 폴더와 파일의 경로를 쉽게 조작할 수 있음

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getImages = async () => {
  let allImages = [];
  let nextCursor = null;
  // cloudinary 피셜 한번에 최대 500개의 데이터를 가져올 수 있어서
  // 한번에 500개 가져오고 do - while 문을 이용해서, 다음 500개가 존재하면 또 가져온다.

  do {
    const result = await cloudinary.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER_NAME}`)
      .sort_by("created_at", "desc")
      .fields("image_metadata")
      .fields("image_metadata.taken_at<1486910712")
      .fields("secure_url")
      .max_results(500) // https://support.cloudinary.com/hc/en-us/articles/205712561-Why-am-I-only-getting-10-results-when-listing-my-resources
      .next_cursor(nextCursor)
      .execute();

    allImages = [...allImages, ...result.resources];
    nextCursor = result.next_cursor;
  } while (nextCursor);

  // allImages 데이터 중 필요한 값들만 뽑아준다.
  const imageData = allImages.map((img) => {
    return {
      public_id: img.public_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      aspect_ratio: img.aspect_ratio,
      created_at: img.created_at,
      taken_at: img.image_metadata.DateTimeOriginal || null, //
    };
  });

  const payload = {
    updated_at: new Date().toISOString(), // 언제 json 파일이 업데이트 되었는지 알 수 있게
    images: imageData,
  };

  // data 폴더가 없으면 생성
  const dataDir = path.dirname("data/images.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync("data/images.json", JSON.stringify(payload, null, 2));
  console.log(`가져온 데이터 총 ${imageData.length}개`);
};

getImages().catch(console.error);
