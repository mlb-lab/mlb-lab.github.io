"""Convert supplied notice JSON into safe News text runs; no network requests.

Existing records are preserved. Re-importing an identical ID is a no-op;
conflicting records are rejected rather than overwriting user edits.
"""
import argparse
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


MARKS = {'em': 'italic', 'i': 'italic', 'u': 'underline',
         'strong': 'bold', 'b': 'bold', 'sup': 'superscript'}


class NoticeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paragraphs = []
        self.current = None
        self.stack = []
        self.marks = Counter()
        self.href = None

    def append(self, text):
        if self.current is None:
            if text.strip():
                raise ValueError('Text outside a paragraph')
            return
        if not text:
            return
        attrs = {key: True for key, count in self.marks.items() if count}
        if self.href:
            attrs['href'] = self.href
        if self.current and {k: v for k, v in self.current[-1].items() if k != 'text'} == attrs:
            self.current[-1]['text'] += text
        else:
            self.current.append({'text': text, **attrs})

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'br':
            if self.current is None:
                raise ValueError('Line break outside a paragraph')
            self.append('\n')
            return
        if tag == 'p':
            if self.current is not None:
                raise ValueError('Nested paragraphs')
            self.current = []
        elif tag in MARKS:
            if self.current is None:
                raise ValueError('Formatting outside a paragraph')
            self.marks[MARKS[tag]] += 1
        elif tag == 'a':
            href = attrs.get('href', '')
            url = urlsplit(href)
            if self.current is None or self.href or url.scheme not in ('http', 'https') or not url.netloc or url.username or url.password:
                raise ValueError('Unsafe or nested link')
            self.href = href
        else:
            raise ValueError(f'Unsupported HTML tag: {tag}')
        self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag != 'br':
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag:
            raise ValueError(f'Unbalanced HTML: {tag}')
        if tag in MARKS:
            self.marks[MARKS[tag]] -= 1
        elif tag == 'a':
            self.href = None
        elif tag == 'p':
            if any(run['text'].strip() for run in self.current):
                self.paragraphs.append(self.current)
            self.current = None

    def handle_data(self, data):
        self.append(re.sub(r'\s+', ' ', data))

    def close(self):
        super().close()
        if self.stack or self.current is not None:
            raise ValueError('Unclosed HTML tags')


def convert(notices):
    result = []
    ids = set()
    for notice in notices:
        identifier = str(notice['id'])
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', identifier) or identifier in ids:
            raise ValueError(f'Invalid or duplicate ID: {identifier}')
        ids.add(identifier)
        day = notice['date']
        if date.fromisoformat(day).isoformat() != day:
            raise ValueError(f'Invalid ISO date: {day}')
        parser = NoticeParser()
        parser.feed(notice['content'])
        parser.close()
        result.append({'id': identifier, 'date': day, 'title': notice['title'],
                       'body': parser.paragraphs, 'images': []})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('src/data/news.json'))
    args = parser.parse_args()
    imported = convert(json.loads(args.input.read_text(encoding='utf-8-sig')))
    existing = json.loads(args.output.read_text(encoding='utf-8'))
    by_id = {post['id']: post for post in existing}
    for post in imported:
        if post['id'] in by_id and by_id[post['id']] != post:
            raise ValueError(f"Conflicting existing ID: {post['id']}")
        if post['id'] not in by_id:
            existing.append(post)
            by_id[post['id']] = post
    existing.sort(key=lambda post: (post['date'], post['id']), reverse=True)
    args.output.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(imported)} notices; total {len(existing)} posts. sourceUrl excluded.')


if __name__ == '__main__':
    main()
