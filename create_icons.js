import { Jimp } from "jimp";

async function run() {
  const image = await Jimp.read(String.raw`C:\Users\utente\.gemini\antigravity\brain\b5f5f7cf-1031-4cba-b211-916d8da84fc9\otica_icon_1778167187830.png`);

  const icon192 = image.clone();
  icon192.resize({ w: 192, h: 192 });
  await icon192.write("public/icon-192.png");

  const icon512 = image.clone();
  icon512.resize({ w: 512, h: 512 });
  await icon512.write("public/icon-512.png");
  
  const favicon = image.clone();
  favicon.resize({ w: 64, h: 64 });
  await favicon.write("public/favicon.png");

  console.log("Done creating icons.");
}
run();
