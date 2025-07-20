async function getFearandGreed() {
  try {
    const response = await fetch("https://web-production-09ad.up.railway.app/https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest", {
      headers: {
        "X-CMC_PRO_API_KEY": "71134d46-3aa7-463c-ab3e-7c073e87dd34",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fear and Greed Index data:", data);
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timed out after 10 seconds");
    } else {
      console.error("Error fetching crypto data:", error);
    }
  }
}

await getFearandGreed();
