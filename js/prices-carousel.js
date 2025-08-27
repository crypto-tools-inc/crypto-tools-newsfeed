let cryptoData = [];
const updateInterval = 60000; // Update every 60 seconds

async function fetchCryptoData() {
  try {
    console.log("Fetching crypto data..."); // Debug log
    const startTime = Date.now();

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const loadTime = Date.now() - startTime;
    console.log(`Crypto data loaded in ${loadTime}ms`); // Debug log

    cryptoData = data;
    renderCryptoTicker();
    updateLastUpdateTime();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timed out after 10 seconds");
    } else {
      console.error("Error fetching crypto data:", error);
    }
    showError();
  }
}

function renderCryptoTicker() {
  const ticker = document.getElementById("cryptoTicker");
  const spinner = document.getElementById("loadingSpinner");

  if (cryptoData.length === 0) {
    showError();
    return;
  }

  // Create ticker items (duplicate for seamless scrolling)
  const createTickerItems = () => {
    return cryptoData
      .map((coin) => {
        const priceChange = coin.price_change_percentage_24h;
        const changeClass = priceChange >= 0 ? "positive" : "negative";
        const changeSymbol = priceChange >= 0 ? "+" : "";

        return `
        <div class="crypto-item">
            <img src="${coin.image}" alt="${coin.name}" class="me-2 rounded-circle" width="20" height="20">
            <span class="crypto-symbol">${coin.symbol.toUpperCase()}</span>
            <span class="crypto-price text-secondary">$${formatPrice(coin.current_price)}</span>
            <span class="crypto-change ${changeClass}">
                ${changeSymbol}${priceChange?.toFixed(2) || "0.00"}%
            </span>
        </div>
        `;
      })
      .join("");
  };

  // Duplicate items for seamless scrolling
  const tickerHTML = createTickerItems() + createTickerItems();

  ticker.innerHTML = tickerHTML;
  ticker.style.display = "flex";
  spinner.style.display = "none";
}

function formatPrice(price) {
  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    // For prices less than $1, show more decimal places
    return price.toFixed(6);
  }
}

function showError() {
  console.log("showError called");

  const ticker = document.getElementById("cryptoTicker");
  const spinner = document.getElementById("loadingSpinner");

  if (!ticker || !spinner) {
    console.error("Cannot show error - DOM elements not found");
    return;
  }

  ticker.innerHTML = `
                <div class="crypto-item">
                    <span style="color: #ef4444;">Failed to load crypto prices. Retrying...</span>
                </div>
            `;
  ticker.style.display = "flex";
  spinner.style.display = "none";

  console.log("Error message displayed");
}

function updateLastUpdateTime() {
  const lastUpdate = document.getElementById("lastUpdate");
  const now = new Date();
  lastUpdate.textContent = `Updated: ${now.toLocaleTimeString()}`;
}

function initCryptoCarousel() {
  console.log("Initializing crypto carousel...");

  // Check if DOM is ready
  const ticker = document.getElementById("cryptoTicker");
  const spinner = document.getElementById("loadingSpinner");

  if (!ticker || !spinner) {
    console.error("DOM elements not found during init! Retrying in 100ms...");
    setTimeout(initCryptoCarousel, 100);
    return;
  }

  console.log("DOM elements found, starting data fetch...");

  // Initial load
  fetchCryptoData();

  // Set up periodic updates
  setInterval(fetchCryptoData, updateInterval);

  // Handle visibility change to pause/resume updates when tab is not active
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("Tab became visible, fetching fresh data");
      fetchCryptoData();
    }
  });
}

// Initialize the crypto carousel when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded");
  initCryptoCarousel();
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === "loading") {
  console.log("Document still loading, waiting for DOMContentLoaded");
} else {
  console.log("Document already loaded, initializing immediately");
  initCryptoCarousel();
}
