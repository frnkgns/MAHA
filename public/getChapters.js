async function fetchChapters(mangaID) {
    try {
      const response = await fetch(`/chapter?id=${mangaID}`); // Send GET request to /chapter
      if (!response.ok) {
        throw new Error("Failed to fetch chapter data.");
      }

      const data = await response.json(); // Get the JSON data
      console.log("Chapter data:", data); // Check data in console

      // Extract and display chapter IDs in console
      const chapterIDs = data.data.map((chapter) => chapter.id);
      console.log("Chapter IDs:", chapterIDs);

      alert("Chapters loaded! Check console for details.");
    } catch (error) {
      console.error("Error fetching chapters:", error.message);
      alert("Error loading chapters.");
    }
  }