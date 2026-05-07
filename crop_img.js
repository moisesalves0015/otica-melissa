import { Jimp } from "jimp";

async function run() {
  const image = await Jimp.read("public/categories_sprite.jpg");
  
  // Grau
  const grau = image.clone();
  grau.crop({ x: 0, y: 140, w: 512, h: 245 });
  await grau.write("public/cat_grau_cut.jpg");

  // Sol
  const sol = image.clone();
  sol.crop({ x: 512, y: 140, w: 512, h: 245 });
  await sol.write("public/cat_sol_cut.jpg");

  // Lentes
  const lentes = image.clone();
  lentes.crop({ x: 0, y: 385, w: 512, h: 245 });
  await lentes.write("public/cat_lentes_cut.jpg");

  // Lançamentos
  const lancamentos = image.clone();
  lancamentos.crop({ x: 512, y: 385, w: 512, h: 245 });
  await lancamentos.write("public/cat_lancamentos_cut.jpg");
  
  console.log("Done cropping.");
}
run();
