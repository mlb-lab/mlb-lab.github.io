import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('import_notices', ROOT / 'scripts/import-notices.py')
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


class ImportNoticesTest(unittest.TestCase):
    def notice(self, content):
        return {'id': '123', 'title': 'Supplied title', 'date': '2025-01-05',
                'content': content, 'sourceUrl': 'https://example.org/ignored'}

    def test_nested_marks_links_entities_and_line_breaks(self):
        result = IMPORTER.convert([self.notice('<p><em><u>A &amp; B</u></em><sup>*</sup><br>Next</p><p><a href="https://example.org/paper"><strong>Paper</strong></a></p>')])[0]
        self.assertNotIn('sourceUrl', result)
        self.assertEqual(result['body'][0][0], {'text': 'A & B', 'italic': True, 'underline': True})
        self.assertEqual(result['body'][0][1], {'text': '*', 'superscript': True})
        self.assertEqual(result['body'][0][2]['text'], '\nNext')
        self.assertEqual(result['body'][1][0], {'text': 'Paper', 'bold': True, 'href': 'https://example.org/paper'})

    def test_unsafe_links_unknown_tags_and_unclosed_markup_are_rejected(self):
        for html in ['<p><script>alert(1)</script></p>', '<p><a href="javascript:alert(1)">X</a></p>', '<p><em>Unclosed</p>']:
            with self.subTest(html=html), self.assertRaises(ValueError):
                IMPORTER.convert([self.notice(html)])

    def test_invalid_dates_and_duplicate_ids_are_rejected(self):
        item = self.notice('<p>Text</p>')
        with self.assertRaises(ValueError):
            IMPORTER.convert([item, item])
        item['date'] = '2025-02-30'
        with self.assertRaises(ValueError):
            IMPORTER.convert([item])


if __name__ == '__main__':
    unittest.main()
