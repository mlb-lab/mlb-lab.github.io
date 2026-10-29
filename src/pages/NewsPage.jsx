import news from '../data/news.json';
import { Fragment } from 'react';
import { EmptyState, ImageSlot, PageHeading } from '../components/common.jsx';
import InlineText from '../components/InlineText.jsx';
import { formatDate, sortNews } from '../lib/content.js';

export function NewsBody({ paragraphs }) {
  return <div className="prose news-body">{paragraphs.map((paragraph, index) => <p key={index}>
    {typeof paragraph === 'string' ? paragraph : paragraph.map((run, i) => {
      let text = <InlineText runs={[run]} />;
      if (run.superscript) text = <sup>{text}</sup>;
      if (run.href) text = <a href={run.href} target="_blank" rel="noopener noreferrer">{text}</a>;
      return <Fragment key={i}>{text}</Fragment>;
    })}
  </p>)}</div>;
}

export function NewsPost({ post }) {
  return <article className="news-post" aria-labelledby={`news-${post.id}`}>
    <div className="news-date"><time dateTime={post.date}>{formatDate(post.date)}</time></div>
    <div className="news-content"><h2 id={`news-${post.id}`}>{post.title}</h2>{post.body.length > 0 && <NewsBody paragraphs={post.body} />}
      {post.images.length > 0 && <div className={`news-gallery ${post.images.length === 1 ? 'single' : ''}`}>
        {post.images.map((image, i) => <ImageSlot key={`${image.src}-${i}`} image={image} label="소식 사진 등록 예정" />)}
      </div>}
    </div>
  </article>;
}

// Rendering is separated from selection so pagination can later pass a sliced list.
export function NewsFeed({ posts }) {
  return <div className="news-feed">{posts.map((post) => <NewsPost key={post.id} post={post} />)}</div>;
}

export default function NewsPage() {
  const posts = sortNews(news);
  return <div className="container page"><PageHeading title="News" />
    {posts.length ? <NewsFeed posts={posts} /> : <EmptyState />}
  </div>;
}
