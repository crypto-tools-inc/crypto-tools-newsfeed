let cryptoData = [];
const updateInterval = 60000; // Update every 60 seconds

async function fetchCryptoData() {
  try {
    console.log("Fetching crypto data..."); // Debug log
    const startTime = Date.now();

    const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Crypto data fetched successfully:", data); // Debug log
    const loadTime = Date.now() - startTime;
    console.log(`Crypto data loaded in ${loadTime}ms`); // Debug log

    cryptoData = data;
    renderCryptoTicker();
    updateLastUpdateTime();
  } catch (error) {
    console.error("Error fetching crypto data:", error);
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
                            <span class="crypto-symbol">${coin.symbol.toUpperCase()}</span>
                            <span class="crypto-price">${formatPrice(coin.current_price)}</span>
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
  const ticker = document.getElementById("cryptoTicker");
  const spinner = document.getElementById("loadingSpinner");

  ticker.innerHTML = `
                <div class="crypto-item">
                    <span style="color: #ef4444;">Failed to load crypto prices. Retrying...</span>
                </div>
            `;
  ticker.style.display = "flex";
  spinner.style.display = "none";
}

function updateLastUpdateTime() {
  const lastUpdate = document.getElementById("lastUpdate");
  const now = new Date();
  lastUpdate.textContent = `Updated: ${now.toLocaleTimeString()}`;
}

function initCryptoCarousel() {
  // Initial load
  fetchCryptoData();

  // Set up periodic updates
  setInterval(fetchCryptoData, updateInterval);

  // Handle visibility change to pause/resume updates when tab is not active
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // Tab is visible, ensure fresh data
      fetchCryptoData();
    }
  });
}

// Initialize the crypto carousel when the page loads
document.addEventListener("DOMContentLoaded", initCryptoCarousel);
