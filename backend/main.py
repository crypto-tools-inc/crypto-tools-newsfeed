import feedparser
import hashlib
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from supabase import create_client, Client
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from dotenv import load_dotenv
import os

load_dotenv()

# Supabase setup
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)


FEEDS = [
    "https://decrypt.co/feed",
    "https://dailyhodl.com/feed/",
    "https://cointelegraph.com/feed",
    "https://coindoo.com/feed/",
    "https://www.coindesk.com/arc/outboundfeeds/rss",
    "https://u.today/rss.php",
    "https://coingape.com/feed/",
    "https://thedefiant.io/api/feed"
]

# 🔌 INIT
analyzer = SentimentIntensityAnalyzer()

# 🔍 Helper: sentiment
def get_sentiment(text: str) -> str:
    score = analyzer.polarity_scores(text)
    if score['compound'] >= 0.05:
        return 'positive'
    elif score['compound'] <= -0.05:
        return 'negative'
    else:
        return 'neutral'

# 🔍 Helper: hash for deduplication
def generate_entry_hash(title: str, link: str, pub_date: str) -> str:
    return hashlib.sha256(f"{title}{link}{pub_date}".encode("utf-8")).hexdigest()


def get_source_name(feed_url: str) -> str:
    parsed = urlparse(feed_url)
    domain = parsed.netloc.replace("www.", "")  # Remove www

    parts = domain.split('.')

    # If there's a subdomain: return subdomain + domain
    if len(parts) > 2:
        return ".".join(parts[:-1])  # Drop TLD
    else:
        return parts[0]  # Just the domain without TLD
    

def remove_unwanted_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove specific tags
    for tag in soup(["img", "a", "iframe"]):
        tag.decompose()
    
    return soup.get_text(separator=" ", strip=True)

# 🚀 Fetch and insert entries
def fetch_and_process():
    for feed_url in FEEDS:
        parsed = feedparser.parse(feed_url)
        for entry in parsed.entries:
            title = entry.get("title", "")
            raw_summary = entry.get("summary", "")
            summary = remove_unwanted_html(raw_summary)
            link = entry.get("link", "")
            pub_date_raw = entry.get("published", "") or entry.get("updated", "")
            pub_date = datetime(*entry.published_parsed[:6]).isoformat() if entry.get("published_parsed") else None

            if not title or not link or not pub_date:
                continue

            entry_hash = generate_entry_hash(title, link, pub_date)

            # Check for duplicates
            existing = supabase.table("news_entries").select("id").eq("hash", entry_hash).execute()
            if existing.data:
                continue  # Skip duplicate

            sentiment = get_sentiment(f"{title} {summary}")

            # Optional: Basic tags via keyword detection
            tags = []
            if "AI" in title or "AI" in summary:
                tags.append("AI")
            if "Bitcoin" in title or "crypto" in summary:
                tags.append("Crypto")

            # Insert entry with 'source'
            supabase.table("news_entries").insert({
                "title": title,
                "summary": summary,
                "link": link,
                "pub_date": pub_date,
                "sentiment": sentiment,
                "hash": entry_hash,
                "tags": tags,
                "source": get_source_name(feed_url).replace('.', '-')
            }).execute()

            print(f"Inserted: {title} from {feed_url}")

# 🔁 Run
if __name__ == "__main__":
    fetch_and_process()
