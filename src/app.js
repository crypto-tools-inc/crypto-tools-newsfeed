import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabase = createClient("https://krperkqbaqewikgzuoea.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycGVya3FiYXFld2lrZ3p1b2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAzMzU4NzcsImV4cCI6MTk5NTkxMTg3N30.ZiwrLZyY8lHlLspcVIagKrF5Bdci_R95lKpDDK56xHM");

const { data, error } = await supabase.from("news_entries").select();
if (data) {
  const feedContainer = document.getElementById("feeds");
  let feed = "";
  data.forEach((entry) => {
    feed += `<a href="${entry.link}" target="_blank" class="list-group-item list-group-item-action">
        <div class="d-flex justify-content-between align-items-center">
        <h5>${entry.title}</h5>
        <span class="badge bg-${entry.sentiment} text-capitalize">${entry.sentiment}</span>
        </div>
      <p>${entry.summary}</p>
      <div class="d-flex justify-content-between">
        <p class="text-muted">Published on: ${new Date(entry.pub_date).toLocaleDateString()}</p>
        <p class="text-muted">${entry.source}</p>
      </div>
    </a>`;
  });
  feedContainer.innerHTML = feed;
}
if (error) {
  console.error("Error fetching data:", error);
}
