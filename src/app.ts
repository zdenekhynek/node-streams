import express, { Application, Request, Response } from "express";
import fetch from "node-fetch";
import fs from "fs";
import stream from "stream";
import { pipeline as pipelineCb } from "stream";
import { promisify } from "util";

const pipeline = promisify(pipelineCb);

const PORT: number = 3001;
const ASSET_URL =
  "https://filesamples.com/samples/font/woff/fontawesome-webfont.woff";

const app: Application = express();

app.get("/font", async (req: Request, res: Response) => {
  const fontResponse = await fetch(ASSET_URL);

  if (fontResponse.body) {
    // Set appropriate headers
    res.setHeader("Content-Type", "font/woff2");

    // Stream the response to the client
    fontResponse.body.pipe(res);
  } else {
    res.status(500).send("Error loading file");
  }
});

app.get("/font-file-seq", async (req: Request, res: Response) => {
  try {
    const fontResponse = await fetch(ASSET_URL);
    if (!fontResponse.ok) {
      throw new Error("Network response was not ok");
    }

    // Create a write stream to the file
    const writeStream = fs.createWriteStream("./font.woff2");
    await fontResponse.body.pipe(writeStream);

    // Set appropriate headers
    res.setHeader("Content-Type", "font/woff2");

    // Stream the response to the client
    fontResponse.body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.get("/font-file-parallel", async (req: Request, res: Response) => {
  try {
    const fontResponse = await fetch(ASSET_URL);
    if (!fontResponse.ok) {
      throw new Error("Network response was not ok");
    }

    // Create a PassThrough stream
    const pass = new stream.PassThrough();
    fontResponse.body.pipe(pass);

    // Create a write stream to the file
    const writeStream = fs.createWriteStream("./font.woff2");

    await Promise.all([pipeline(pass, writeStream), pipeline(pass, res)]);

    // Set appropriate headers
    res.setHeader("Content-Type", "font/woff2");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

app.listen(PORT, (): void => {
  console.log("SERVER IS UP ON PORT:", PORT);
});
