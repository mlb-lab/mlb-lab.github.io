import importlib.util
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("import_publications", ROOT / "scripts/import-publications.py")
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


class ImportPublicationsTest(unittest.TestCase):
    def test_inline_marks_entities_nesting_and_literal_stars(self):
        html = '''<p align="right"><u>Students</u> and <strong>PI</strong> (* corresponding author)</p>
<p class="mt40"><u><strong>A &amp; B*</strong></u>, C.
<a href="https://example.org/paper?q=1&amp;page=2">Title <i>de novo</i></a>.
<i>Journal &amp; Review</i>, 2:3. 2026. (Additional note.)</p>'''
        papers, note = IMPORTER.convert_html(html)
        paper = papers[0]
        self.assertEqual(paper["authors"], [{"text": "A & B*", "bold": True, "underline": True}, {"text": "C."}])
        self.assertEqual(paper["title"], [{"text": "Title "}, {"text": "de novo", "italic": True}])
        self.assertEqual(paper["venue"], [{"text": "Journal & Review", "italic": True}, {"text": ", 2:3. 2026. (Additional note.)"}])
        self.assertEqual(paper["url"], "https://example.org/paper?q=1&page=2")
        self.assertEqual(paper["year"], 2026)
        self.assertEqual(note[0], {"text": "Students", "underline": True})

    def test_dagger_characters_and_entities_are_preserved_in_authors(self):
        html = '''<p class="mt40"><u>Author A&dagger;</u>, <strong>Author B*†</strong>.
<a href="https://example.org/paper">Title</a>. Journal. 2026.</p>'''
        papers, _ = IMPORTER.convert_html(html)
        self.assertEqual(papers[0]["authors"], [
            {"text": "Author A†", "underline": True},
            {"text": "Author B*†", "bold": True},
        ])

    def test_supplied_43_records_match_source_text_links_order_and_saved_json(self):
        html = (ROOT / "tests/fixtures/publications-source.html").read_text(encoding="utf-8-sig")
        source = IMPORTER.PublicationParser()
        source.feed(html)
        source.close()
        papers, note = IMPORTER.convert_html(html)
        self.assertEqual(len(papers), 43)
        saved = json.loads((ROOT / "src/data/publications.json").read_text(encoding="utf-8"))
        by_id = {paper["id"]: paper for paper in saved}
        # New records may be added later; the supplied records must retain their content.
        for order, (raw, paper) in enumerate(zip(source.records, papers), 1):
            for field in ["title", "venue"]:
                expected = re.sub(r"\s+", " ", "".join(chunk["text"] for chunk in raw[field])).strip()
                if field == "venue":
                    expected = expected.removeprefix(".").lstrip()
                self.assertEqual(IMPORTER.plain(paper[field]), expected)
            def words(text):
                return [word for word in re.findall(r"\w+|\*", text) if word.lower() != "and"]
            self.assertEqual(words(" ".join(run["text"] for run in paper["authors"])), words("".join(chunk["text"] for chunk in raw["authors"])))
            for mark in ["bold", "underline", "italic"]:
                self.assertEqual(words(" ".join(run["text"] for run in paper["authors"] if run.get(mark))), words(" ".join(chunk["text"] for chunk in raw["authors"] if chunk.get(mark))))
            self.assertEqual(paper["url"], raw["url"])
            self.assertEqual(paper["displayOrder"], order)
            # Display metadata may be edited independently of source bibliographic content.
            self.assertEqual({key: value for key, value in by_id[paper["id"]].items() if key != "displayOrder"},
                             {key: value for key, value in paper.items() if key != "displayOrder"})
        # Keep the source notice intact while allowing an additional authorship legend.
        saved_note = json.loads((ROOT / "src/data/publications-note.json").read_text(encoding="utf-8"))
        self.assertEqual(saved_note[:len(note)], note)
        self.assertEqual(sum(p["year"] == 2026 for p in papers), 5)
        self.assertTrue(any(run.get("bold") and "The ENCODE Project Consortium" in run["text"] for p in papers for run in p["authors"]))
        self.assertTrue(any(run.get("italic") and "de novo" in run["text"] for p in papers for run in p["title"]))
        self.assertTrue(any("Invited to Journal" in IMPORTER.plain(p["venue"]) for p in papers))

    def test_unknown_markup_malformed_html_and_bad_links_fail(self):
        for html in ['<p><script>alert(1)</script></p>', '<p><u>x</strong></p>', '<p class="mt40">A.<a href="javascript:alert(1)">Title</a>Journal. 2026.</p>']:
            with self.assertRaises(ValueError):
                IMPORTER.convert_html(html)


if __name__ == "__main__":
    unittest.main()
