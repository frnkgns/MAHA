import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
// ✅ Update views and static paths
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views")); // Update for views folder
app.use(express.static(path.join(__dirname, "../public"))); // Update for public folder
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://maho-topaz.vercel.app/'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);


const port = 3000;
const baseUrl = "https://api.mangadex.org";
const languages = ["en"];

app.get("/", async (req, res) => {
  try {
    // Get manga data
    const response = await axios.get(`${baseUrl}/manga`);
    const result = response.data
  
    // Fetch cover file names dynamically
    const mangaData = await Promise.all(
 
      result.data.map(async (item) => {
        const coverRel = item.relationships.find(
          (rel) => rel.type === "cover_art"
        );

        if (coverRel) {
          try {
            // Fetch cover details to get the correct fileName
            const coverResponse = await axios.get(
              `https://api.mangadex.org/cover/${coverRel.id}`
            );
            item.coverFileName = coverResponse.data.data.attributes.fileName;

          } catch (coverError) {
            console.error(
              `Failed to get cover for ${item.id}:`,
              coverError.message
            );
            item.coverFileName = null;
          }
        } else {
          item.coverFileName = null;
        }
        
        return item;

      })
    );

    // Render index.ejs with manga data and coverFileName
    res.render("index.ejs", { data: { data: mangaData } });

  } catch (error) {
    console.error("Failed to fetch manga data:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.get("/chapter", async (req, res) => {
  const mangaID = req.query.id;
  console.log("✅ Chapter requested for Manga ID:", mangaID);

  if (!mangaID) {
    return res.status(400).send("Manga ID is required.");
  }

  try {
    const resp = await axios({
      method: "GET",
      url: `${baseUrl}/manga/${mangaID}/feed`,
      params: {
        translatedLanguage: languages,
      },
    });

    res.json(resp.data);
  } catch (error) {
    console.error("❌ Error fetching chapters:", error.message);
    res.status(500).send("Error fetching chapters.");
  }
});

app.get("/read", async (req, res) => {
  const chapterID = req.query.id;
  console.log("✅ Chapter requested for Chapter ID:", chapterID);

  if (!chapterID) {
    return res.status(400).send("Chapter ID is required.");
  }

  try {
    const chapterResp = await axios.get(`${baseUrl}/at-home/server/${chapterID}`);
    const baseUrlImg = chapterResp.data.baseUrl;
    const chapterHash = chapterResp.data.chapter.hash;
    const images = chapterResp.data.chapter.data.map(
      (img) => `${baseUrlImg}/data/${chapterHash}/${img}`
    );

    res.render("read.ejs", { images });
  } catch (error) {
    console.error("❌ Error fetching chapter content:", error.message);
    res.status(500).send("Error fetching chapter content.");
  }
});

app.get("/search", async (req, res) => {
  const title = req.query.query; // ✅ Get the search query from the URL

  if (!title) {
    return res.status(400).send("Search query is required.");
  }

  try {
    // ✅ Fetch manga results based on the search query
    const resp = await axios({
      method: "GET",
      url: `${baseUrl}/manga`,
      params: {
        title: title, // ✅ Send the query as a parameter
      },
    });

    const searchResults = resp.data.data;

    // ✅ Fetch cover data dynamically
    const mangaData = await Promise.all(
      searchResults.map(async (item) => {
        const coverRel = item.relationships.find(
          (rel) => rel.type === "cover_art"
        );

        if (coverRel) {
          try {
            const coverResponse = await axios.get(
              `https://api.mangadex.org/cover/${coverRel.id}`
            );
            item.coverFileName = coverResponse.data.data.attributes.fileName;
          } catch (coverError) {
            console.error(`Failed to get cover for ${item.id}:`, coverError.message);
            item.coverFileName = null;
          }
        } else {
          item.coverFileName = null;
        }
        return item;
      })
    );

    // ✅ Render `index.ejs` with search results
    res.render("index.ejs", { data: { data: mangaData } });

  } catch (error) {
    console.error("Error fetching search results:", error.message);
    res.status(500).send("Error fetching search results.");
  }
});


app.listen(port, () => {
  console.log("Listening to port:", port);
});


