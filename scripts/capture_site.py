"""Capture public Pele content pages and linked Markdown, with a bounded crawl.

This is an evidence archive, not an offline website mirror. JavaScript, CSS,
fonts and external sites are inventoried but not downloaded or executed.
"""

import argparse
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ORIGIN = "https://pele.run"
MAX_BYTES = 20_000_000


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.assets = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.add(attrs["href"])
        if tag in {"script", "img", "source", "link"}:
            value = attrs.get("src") or attrs.get("href")
            if value:
                self.assets.add(value)


def canonical(value, base):
    parts = urllib.parse.urlsplit(urllib.parse.urljoin(base, value))
    if parts.scheme != "https" or parts.netloc != "pele.run":
        return None
    path = parts.path.rstrip("/") or "/"
    if Path(path).suffix not in {"", ".md", ".txt", ".xml"}:
        return None
    return ORIGIN + path


def fetch(url):
    started = time.monotonic()
    record = {"url": url}
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Pele documentation research)", "Accept": "text/html,text/markdown,text/plain,application/xml"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = response.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES:
                raise ValueError("Response exceeds 20 MB capture limit")
            record.update(status=response.status, content_type=response.headers.get("Content-Type", ""), final_url=response.url, bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
    except urllib.error.HTTPError as error:
        record.update(status=error.code, error=str(error))
        data = b""
    except Exception as error:
        record.update(status=None, error=str(error))
        data = b""
    record["elapsed_seconds"] = round(time.monotonic() - started, 3)
    return record, data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-pages", type=int, default=160)
    parser.add_argument("--deadline", type=int, default=240)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    archive_path = args.output / "site.zip"
    manifest_path = args.output / "manifest.json"
    if archive_path.exists() or manifest_path.exists():
        parser.error("Output already contains a capture; choose a new output directory")
    pending = {ORIGIN + p for p in ["/", "/index.md", "/robots.txt", "/sitemap.xml", "/llms.txt", "/compare", "/video", "/video/visual", "/404"]}
    seen, records, assets, external = set(), [], set(), set()
    end = time.monotonic() + args.deadline
    with zipfile.ZipFile(archive_path, "x", zipfile.ZIP_DEFLATED) as archive, ThreadPoolExecutor(max_workers=3) as pool:
        while pending and len(seen) < args.max_pages and time.monotonic() < end:
            batch = sorted(pending)[:min(3, args.max_pages - len(seen))]
            pending.difference_update(batch)
            seen.update(batch)
            for record, data in pool.map(fetch, batch):
                records.append(record)
                print(record["status"], record["url"], record.get("bytes", 0), flush=True)
                if record["status"] != 200:
                    continue
                path = urllib.parse.urlsplit(record["url"]).path
                suffix = "" if Path(path).suffix else ".html"
                filename = (path.strip("/") or "index") + suffix
                record["archive_path"] = filename
                archive.writestr(filename, data)
                text = data.decode("utf-8", errors="replace")
                links = set()
                if "html" in record["content_type"]:
                    page = Links()
                    page.feed(text)
                    links.update(page.links)
                    assets.update(urllib.parse.urljoin(record["url"], a) for a in page.assets)
                elif path.endswith(".xml"):
                    root = ET.fromstring(text)
                    links.update(node.text for node in root.iter() if node.tag.endswith("}loc") and node.text)
                for link in links:
                    target = canonical(link, record["url"])
                    if target and target not in seen:
                        pending.add(target)
                    elif urllib.parse.urlsplit(link).netloc not in {"", "pele.run"}:
                        external.add(link)
    manifest = {"captured_at": datetime.now(timezone.utc).isoformat(), "origin": ORIGIN, "scope": "Public content routes from sitemap, HTML links, and source-discovered compare/video/404 routes; query and fragment variations are deduplicated.", "assets_policy": "Inline SVG retained in HTML; linked JS/CSS/fonts/media inventoried only. External sites are not recursively crawled.", "records": sorted(records, key=lambda row: row["url"]), "unvisited": sorted(pending), "linked_assets": sorted(assets), "external_links": sorted(external), "archive_sha256": hashlib.sha256(archive_path.read_bytes()).hexdigest()}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"fetched": len(records), "ok": sum(r["status"] == 200 for r in records), "unvisited": len(pending), "archive": str(archive_path)}))
    return 1 if pending else 0


if __name__ == "__main__":
    raise SystemExit(main())
