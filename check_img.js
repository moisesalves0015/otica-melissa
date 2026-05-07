import { Jimp } from "jimp";

async function run() {
  const image = await Jimp.read("public/categories_sprite.jpg");
  console.log(`Width: ${image.bitmap.width}, Height: ${image.bitmap.height}`);
}
run();
