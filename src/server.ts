import express from "express";

import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.get("/movies", async (req, res) => {
  const movie = await prisma.movie.findMany();
  res.json(movie);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
