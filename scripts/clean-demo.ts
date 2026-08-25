import "dotenv/config";

import { getPrismaClient } from "../src/server/db/client";
import { cleanDemoData } from "./demo-data";

const prisma = getPrismaClient();

cleanDemoData()
  .then(({ removedMedia }) => {
    console.log(`Datos demo eliminados. Medios exclusivos retirados: ${removedMedia}.`);
    console.log("Las tallas genéricas se conservan porque pueden reutilizarse en el catálogo real.");
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se han podido limpiar los datos demo.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
