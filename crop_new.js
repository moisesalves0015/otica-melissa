import { Jimp } from "jimp";

async function run() {
  const image = await Jimp.read("public/categories_sprite_new.jpg");
  
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  console.log(`Width: ${w}, Height: ${h}`);

  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  const grau = image.clone();
  grau.crop({ x: 0, y: 0, w: halfW, h: halfH });
  await grau.write("public/cat_grau_cut.jpg");

  const sol = image.clone();
  sol.crop({ x: halfW, y: 0, w: w - halfW, h: halfH });
  await sol.write("public/cat_sol_cut.jpg");

  const lentes = image.clone();
  lentes.crop({ x: 0, y: halfH, w: halfW, h: h - halfH });
  await lentes.write("public/cat_lentes_cut.jpg");

  const lancamentos = image.clone();
  lancamentos.crop({ x: halfW, y: halfH, w: w - halfW, h: h - halfH });
  await lancamentos.write("public/cat_lancamentos_cut.jpg");
  
  console.log("Done cropping new perfectly.");
}
run();
