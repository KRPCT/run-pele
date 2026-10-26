"""Extract Mermaid examples and their provenance from a captured Pele site ZIP."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Output exists; choose a new file to compare before replacing the catalog")
    examples = {}
    pages = {}
    with zipfile.ZipFile(args.archive) as archive:
        for name in sorted(archive.namelist()):
            if not name.endswith(".md") or not name.startswith("examples/"):
                continue
            page_type = Path(name).stem
            text = archive.read(name).decode("utf-8").replace("\r\n", "\n")
            matches = list(re.finditer(r"^```mermaid[^\n]*\n(.*?)^```\s*$", text, re.M | re.S))
            pages[page_type] = {"url": "https://pele.run/" + name[:-3], "blocks": len(matches)}
            for index, match in enumerate(matches, 1):
                source = match[1].strip() + "\n"
                digest = hashlib.sha256(source.encode()).hexdigest()
                entry = examples.setdefault(digest, {"id": digest[:16], "page_type": page_type, "source": source, "origins": []})
                headings = re.findall(r"^#{2,3} (.+)$", text[:match.start()], re.M)
                entry["origins"].append({"url": "https://pele.run/" + name, "block": index, "section": headings[-1] if headings else "Examples"})
    data = {"schema": 1, "source_archive_sha256": hashlib.sha256(args.archive.read_bytes()).hexdigest(), "pages": pages, "examples": list(examples.values())}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"types": len(pages), "blocks": sum(p["blocks"] for p in pages.values()), "unique": len(examples)}))


if __name__ == "__main__":
    main()
