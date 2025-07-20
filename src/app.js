import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabase = createClient("https://krperkqbaqewikgzuoea.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycGVya3FiYXFld2lrZ3p1b2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAzMzU4NzcsImV4cCI6MTk5NTkxMTg3N30.ZiwrLZyY8lHlLspcVIagKrF5Bdci_R95lKpDDK56xHM");

// Store current feeds data
let currentFeeds = [];

// Function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const publishedDate = new Date(date);
  const diffInSeconds = Math.floor((now - publishedDate) / 1000);

  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? "just now" : `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}

// Function to render feeds
function renderFeeds(feeds) {
  const feedContainer = document.getElementById("feeds");
  let feed = "";
  feeds.forEach((entry) => {
    feed += `<a href="${entry.link}" target="_blank" class="list-group-item list-group-item-action">
        <div class="d-flex justify-content-between align-items-center">
        <h6>${entry.title}</h6>
        <span class="badge bg-${entry.sentiment} text-capitalize">${entry.sentiment}</span>
        </div>
      <p class="m-0 small">${entry.summary}</p>
      <div class="d-flex justify-content-between">
        <p class="m-0 small text-muted">${getRelativeTime(entry.pub_date)}</p>
        <div class="d-flex align-items-center">
        <img src="src/img/${entry.source}.png" width="14" height="14" alt="${entry.source}" class="img-fluid me-2">
        <p class="m-0 text-muted text-capitalize small">${entry.source}</p>
        </div>
      </div>
    </a>`;
  });
  feedContainer.innerHTML = feed;
}

// Function to add new feed to the beginning of the list
function addNewFeed(newEntry) {
  // Add the new entry to the beginning of the array
  currentFeeds.unshift(newEntry);

  // Keep only the latest 100 entries
  if (currentFeeds.length > 100) {
    currentFeeds = currentFeeds.slice(0, 100);
  }

  // Re-render the feeds
  renderFeeds(currentFeeds);
}

// Initial data fetch
async function loadInitialData() {
  try {
    const { data, error } = await supabase.from("news_entries").select().order("pub_date", { ascending: false }).limit(100);

    if (error) {
      console.error("Error fetching initial data:", error);
      return;
    }

    if (data) {
      currentFeeds = data;
      renderFeeds(currentFeeds);
    }
  } catch (err) {
    console.error("Error loading initial data:", err);
  }
}

// Set up realtime subscription
function setupRealtimeSubscription() {
  const channel = supabase
    .channel("news_entries_changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "news_entries",
      },
      (payload) => {
        console.log("New feed received:", payload.new);
        // Add the new entry to our feeds
        addNewFeed(payload.new);

        // Optional: Add visual feedback for new entries
        showNewEntryNotification();
      }
    )
    .subscribe((status) => {
      console.log("Realtime subscription status:", status);
    });

  return channel;
}

// Optional: Show notification for new entries
function showNewEntryNotification() {
  // Create a simple notification
  const notification = document.createElement("div");
  notification.className = "alert alert-info alert-dismissible fade show position-fixed";
  notification.style.cssText = "top: 20px; right: 20px; z-index: 1050; max-width: 300px;";
  notification.innerHTML = `
    <strong>New feed added!</strong> Check out the latest news entry.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Initialize the application
async function init() {
  try {
    // Load initial data
    await loadInitialData();

    // Set up realtime subscription
    const channel = setupRealtimeSubscription();

    console.log("News feed initialized with realtime updates");

    // Update relative times every minute
    setInterval(() => {
      renderFeeds(currentFeeds);
    }, 60000); // Update every minute

    // Optional: Handle page unload to clean up subscription
    window.addEventListener("beforeunload", () => {
      supabase.removeChannel(channel);
    });
  } catch (error) {
    console.error("Error initializing news feed:", error);
  }
}

// Start the application
init();
