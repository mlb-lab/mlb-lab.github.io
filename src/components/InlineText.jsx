import { Fragment } from 'react';

// Render only text and explicitly supported marks, never HTML from content files.
export default function InlineText({ runs, superscriptDaggers = false }) {
  return runs.map((run, index) => {
    let content = superscriptDaggers
      ? run.text.split(/(†)/).map((part, partIndex) => part === '†' ? <sup key={partIndex}>†</sup> : part)
      : run.text;
    if (run.bold) content = <strong>{content}</strong>;
    if (run.italic) content = <em>{content}</em>;
    if (run.underline) content = <u>{content}</u>;
    return <Fragment key={index}>{content}</Fragment>;
  });
}
