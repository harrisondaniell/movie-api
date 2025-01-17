import express, { urlencoded } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
const prisma = new PrismaClient();

app.use(urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use(express.json());

app.get("/movies", async (req: Request, res: Response) => {
  const movie = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
    include: {
      genres: true,
      languages: true,
    },
  });
  res.json(movie);
});

app.post("/movies", async (req: Request, res: Response) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;
  try {
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
      },
    });

    if (movieWithSameTitle) {
      return res
        .status(409)
        .send({ message: "Já existe um filme cadastrado com esse título" });
    }

    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date),
      },
    });
  } catch (error) {
    return res.status(500).send({ message: "Falha ao cadastrar um filme" });
  }
  res.status(201).send(req.body.title);
});

app.put("/movies/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const getId = await prisma.movie.findUnique({
      where: {
        id,
      },
    });

    if (!getId) {
      return res.status(404).send({ message: "Filme não encontrado" });
    }

    const data = { ...req.body };

    if (data.release_date) {
      data.release_date = new Date(data.release_date);
    }

    const movie = await prisma.movie.update({
      where: {
        id,
      },
      data: data,
    });
    res.status(200).send(movie);
  } catch (error) {
    return res
      .status(500)
      .send({ message: "falha ao atualizar o registro do filme" });
  }
});

app.delete("/movies/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const verifyMovie = await prisma.movie.findUnique({
    where: {
      id,
    },
  });

  try {
    if (!verifyMovie) {
      return res.status(404).send({ message: "O filme não foi encontrado" });
    }

    const movie = await prisma.movie.delete({
      where: {
        id,
      },
    });

    return res.status(200).send(movie);
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Não foi possível remover o filme" });
  }
});

app.get("/movies/:genreName", async (req: Request, res: Response) => {
  try {
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },
      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: "insensitive",
          },
        },
      },
    });
    return res.status(200).send(moviesFilteredByGenreName);
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Falha ao filtrar filmes por gênero" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
