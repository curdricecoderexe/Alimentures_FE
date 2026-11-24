/*
 * Article body markup for The Grain Journal.
 *
 * Admin/staff write articles as plain text with a few line prefixes; this file
 * turns that text into the body blocks the article page renders (and back, for
 * importing the built-in starter articles). It stays Node-safe because the
 * build-time prerender (scripts/prerender.js) uses it too.
 *
 *   Plain lines            paragraph (a blank line starts a new one)
 *   ## Heading             section heading
 *   - item                 bullet list (consecutive lines)
 *   > quote text           pull quote
 *   -- Who said it         quote credit (line right after a quote)
 *   ! tip text             highlighted kitchen tip
 *
 * Everything is rendered as text by React — never as HTML.
 */

export const CONTENT_GUIDE = [
  ['Paragraph', 'Write normally. Leave a blank line between paragraphs.'],
  ['## Heading', 'A section heading.'],
  ['- Item', 'A bullet point. Put each item on its own line.'],
  ['> Quote', 'A pull quote.'],
  ['-- Name', 'Credit for the quote, on the line after it.'],
  ['! Tip', 'A highlighted kitchen tip.'],
];

export function parseContent(text = '') {
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ p: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ list });
    list = null;
  };

  for (const raw of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }

    if (/^[-*•]\s+/.test(line) && !line.startsWith('-- ')) {
      flushPara();
      (list ||= []).push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }
    flushList();

    if (line.startsWith('## ')) { flushPara(); blocks.push({ h2: line.slice(3).trim() }); continue; }
    if (line.startsWith('> ')) {
      flushPara();
      const prev = blocks[blocks.length - 1];
      if (prev?.quote && !prev.cite) prev.quote = `${prev.quote} ${line.slice(2).trim()}`;
      else blocks.push({ quote: line.slice(2).trim() });
      continue;
    }
    if ((line.startsWith('-- ') || line.startsWith('— ')) && blocks[blocks.length - 1]?.quote && !para.length) {
      blocks[blocks.length - 1].cite = line.replace(/^(--|—)\s+/, '');
      continue;
    }
    if (line.startsWith('! ')) { flushPara(); blocks.push({ tip: line.slice(2).trim() }); continue; }
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** Inverse of parseContent — used to import the built-in starter articles. */
export function blocksToContent(blocks = []) {
  return blocks.map((b) => {
    if (b.h2) return `## ${b.h2}`;
    if (b.list) return b.list.map((i) => `- ${i}`).join('\n');
    if (b.quote) return `> ${b.quote}${b.cite ? `\n-- ${b.cite}` : ''}`;
    if (b.tip) return `! ${b.tip}`;
    return b.p || '';
  }).join('\n\n');
}
