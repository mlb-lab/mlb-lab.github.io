"""Convert the supplied publication HTML fragment to safe inline-text JSON.

No requests are made to publication URLs. Requires only the Python standard library.
"""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unicodedata


MARKS = {"u": "underline", "strong": "bold", "b": "bold", "i": "italic", "em": "italic"}


def normalize_runs(chunks):
    """Collapse HTML whitespace across tag boundaries without dropping formatting."""
    result = []
    last_space = True
    for chunk in chunks:
        marks = {key: True for key in ("bold", "underline", "italic") if chunk.get(key)}
        text = ""
        for char in chunk["text"]:
            if char.isspace():
                if not last_space:
                    text += " "
                last_space = True
            else:
                text += char
                last_space = False
        if not text:
            continue
        if result and {key: value for key, value in result[-1].items() if key != "text"} == marks:
            result[-1]["text"] += text
        else:
            result.append({"text": text, **marks})
    if result:
        result[-1]["text"] = result[-1]["text"].rstrip()
        if not result[-1]["text"]:
            result.pop()
    return result


def plain(runs):
    return "".join(run["text"] for run in runs)


def authors_from_runs(chunks):
    """One formatted name per entry; sentence punctuation is rendered by React."""
    runs = normalize_runs(chunks)
    while runs and re.fullmatch(r"[\s,.]*", runs[-1]["text"]):
        runs.pop()
    if runs:
        last = runs[-1]["text"]
        # Keep initials and common suffixes; remove a terminal sentence period.
        abbreviation = re.search(r"(?:\b[A-Z]\.|\bJr\.|\bSr\.|\bPh\.D\.|\bM\.D\.)$", last)
        if last.endswith(".") and not abbreviation:
            runs[-1] = {**runs[-1], "text": last[:-1]}
    authors = []
    for run in runs:
        for piece in run["text"].split(","):
            name = re.sub(r"^and\s+", "", piece.strip(), flags=re.IGNORECASE)
            if name.lower() == "and" or not re.search(r"\w", name):
                continue
            authors.append({**run, "text": name})
    return authors


class PublicationParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.records = []
        self.notes = []
        self.current = None
        self.section = None
        self.stack = []
        self.marks = Counter()

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "p":
            if self.current is not None:
                raise ValueError("Nested publication paragraphs are unsupported")
            self.current = {"paper": "mt40" in attributes.get("class", "").split(), "authors": [], "title": [], "venue": [], "note": [], "url": None}
            self.section = "authors" if self.current["paper"] else "note"
        elif tag == "a":
            if not self.current or not self.current["paper"] or self.current["url"] is not None or self.section != "authors":
                raise ValueError("Expected one title link per paper")
            self.current["url"] = attributes.get("href")
            if not self.current["url"] or not re.match(r"^https?://", self.current["url"]):
                raise ValueError("Expected an http(s) title URL")
            self.section = "title"
        elif tag in MARKS and self.current is not None:
            self.marks[MARKS[tag]] += 1
        else:
            raise ValueError(f"Unsupported HTML tag: {tag}")
        self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag:
            raise ValueError(f"Unbalanced HTML closing tag: {tag}")
        if tag in MARKS:
            self.marks[MARKS[tag]] -= 1
        elif tag == "a":
            self.section = "venue"
        elif tag == "p":
            record = self.current
            self.current = None
            if record["paper"]:
                self.records.append(record)
            else:
                if self.notes:
                    self.notes.append({"text": " "})
                self.notes.extend(record["note"])

    def handle_data(self, text):
        if self.current is None:
            if text.strip():
                raise ValueError("Text outside a paragraph")
            return
        self.current[self.section].append({"text": text, **{mark: True for mark, count in self.marks.items() if count}})


def convert_html(html):
    parser = PublicationParser()
    parser.feed(html)
    parser.close()
    if parser.stack or parser.current:
        raise ValueError("Unclosed HTML tags")
    publications = []
    seen = set()
    for index, record in enumerate(parser.records):
        title = normalize_runs(record["title"])
        authors = authors_from_runs(record["authors"])
        venue = normalize_runs(record["venue"])
        # The period after the title link separates blocks in the old layout.
        if venue and venue[0]["text"].startswith("."):
            venue[0]["text"] = venue[0]["text"][1:]
            venue = normalize_runs(venue)
        if not title or not authors or not venue or not record["url"]:
            raise ValueError(f"Missing bibliographic content in paper {index + 1}")
        years = re.findall(r"\b(?:19|20)\d{2}\b", plain(venue))
        if not years:
            raise ValueError(f"Missing publication year in paper {index + 1}")
        year = int(years[-1])
        normalized = unicodedata.normalize("NFKD", plain(title)).encode("ascii", "ignore").decode().lower()
        slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
        identifier = f"{year}-{slug}"
        if identifier in seen:
            raise ValueError(f"Duplicate publication ID: {identifier}")
        seen.add(identifier)
        publications.append({"id": identifier, "title": title, "authors": authors, "venue": venue,
                             "year": year, "displayOrder": index + 1, "url": record["url"]})
    return publications, normalize_runs(parser.notes)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--input", required=True, type=Path)
    cli.add_argument("--output", required=True, type=Path)
    cli.add_argument("--note-output", required=True, type=Path)
    cli.add_argument("--expected-count", type=int)
    args = cli.parse_args()
    publications, note = convert_html(args.input.read_text(encoding="utf-8-sig"))
    if args.expected_count is not None and len(publications) != args.expected_count:
        raise ValueError(f"Expected {args.expected_count} papers, found {len(publications)}")
    for path, data in [(args.output, publications), (args.note_output, note)]:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Converted {len(publications)} papers and {len(note)} note runs; original order retained.")


if __name__ == "__main__":
    main()
