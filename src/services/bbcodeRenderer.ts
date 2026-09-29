/**
 * XenForo GTA5RP BB-Code to HTML Renderer
 * Converts forum BB-code into authentic, rich HTML preview.
 */

export function bbcodeToHtml(bbcode: string): string {
  if (!bbcode) return '';

  let html = bbcode;

  // Escape HTML entities to prevent injection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Spoilers with and without title
  html = html.replace(/\[SPOILER="?([^"\]]*)"?\]([\s\S]*?)\[\/SPOILER\]/gi, (_match, title, content) => {
    return `<details class="forum-spoiler" style="margin: 10px 0; border: 1px solid rgba(236,199,129,0.3); border-radius: 4px; background: rgba(0,0,0,0.35); overflow: hidden;"><summary style="cursor: pointer; padding: 7px 12px; font-weight: 700; color: #ecc781; background: rgba(236,199,129,0.1); user-select: none; font-size: 13px;">📁 ${title || 'Спойлер'}</summary><div style="padding: 12px 16px;">${content}</div></details>`;
  });
  html = html.replace(/\[SPOILER\]([\s\S]*?)\[\/SPOILER\]/gi, (_match, content) => {
    return `<details class="forum-spoiler" style="margin: 10px 0; border: 1px solid rgba(236,199,129,0.3); border-radius: 4px; background: rgba(0,0,0,0.35); overflow: hidden;"><summary style="cursor: pointer; padding: 7px 12px; font-weight: 700; color: #ecc781; background: rgba(236,199,129,0.1); user-select: none; font-size: 13px;">📁 Спойлер</summary><div style="padding: 12px 16px;">${content}</div></details>`;
  });

  // 2. Attachments
  html = html.replace(/\[ATTACH[^\]]*\]([0-9]+)\[\/ATTACH\]/gi, (_match, id) => {
    return `<span style="display: inline-block; padding: 2px 8px; background: rgba(236,199,129,0.12); border: 1px solid rgba(236,199,129,0.25); border-radius: 3px; font-size: 11px; color: #ecc781; margin: 2px 0;">📎 Вложение #${id}</span>`;
  });

  // 3. Images (with width, size, or bare [IMG])
  html = html.replace(/\[IMG(?:\s+[^\]]*)?\]([\s\S]*?)\[\/IMG\]/gi, (_match, url) => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) return '';
    return `<div style="text-align: center; margin: 10px 0;"><img src="${cleanUrl}" alt="forum-img" style="max-width: 100%; height: auto; border-radius: 4px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" loading="lazy" onerror="this.style.display='none'" /></div>`;
  });

  // 4. Quotes
  html = html.replace(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/gi, (_match, content) => {
    return `<blockquote style="border-left: 3px solid #ecc781; padding: 8px 14px; margin: 8px 0; background: rgba(255,255,255,0.03); color: #d4d4d8; font-style: italic;">${content}</blockquote>`;
  });

  // 5. Alignment
  html = html.replace(/\[CENTER\]([\s\S]*?)\[\/CENTER\]/gi, (_match, content) => {
    return `<div style="text-align: center; margin: 4px 0;">${content}</div>`;
  });
  html = html.replace(/\[LEFT\]([\s\S]*?)\[\/LEFT\]/gi, (_match, content) => {
    return `<div style="text-align: left; margin: 4px 0;">${content}</div>`;
  });
  html = html.replace(/\[RIGHT\]([\s\S]*?)\[\/RIGHT\]/gi, (_match, content) => {
    return `<div style="text-align: right; margin: 4px 0;">${content}</div>`;
  });

  // 6. Indents (INDENT and INDENT=N)
  html = html.replace(/\[INDENT(?:=([0-9]+))?\]([\s\S]*?)\[\/INDENT\]/gi, (_match, level, content) => {
    const depth = level ? Math.min(parseInt(level, 10), 6) : 1;
    return `<div style="padding-left: ${depth * 24}px; margin: 3px 0; line-height: 1.6;">${content}</div>`;
  });

  // 7. Styling: Bold, Italic, Underline, Strike (repeat 2x for nesting)
  for (let i = 0; i < 2; i++) {
    html = html.replace(/\[B\]([\s\S]*?)\[\/B\]/gi, '<strong>$1</strong>');
    html = html.replace(/\[I\]([\s\S]*?)\[\/I\]/gi, '<em>$1</em>');
    html = html.replace(/\[U\]([\s\S]*?)\[\/U\]/gi, '<u style="text-underline-offset: 3px;">$1</u>');
    html = html.replace(/\[S\]([\s\S]*?)\[\/S\]/gi, '<s>$1</s>');
  }

  // 8. Colors (support nested colors)
  for (let i = 0; i < 3; i++) {
    html = html.replace(/\[COLOR="?([^"\]]*)"?\]([\s\S]*?)\[\/COLOR\]/gi, (_match, color, content) => {
      const c = color.trim().toLowerCase();
      if (!c || c === 'null' || c === 'inherit') {
        return `<span>${content}</span>`;
      }
      return `<span style="color: ${color};">${content}</span>`;
    });
  }

  // 9. Fonts
  html = html.replace(/\[FONT="?([^"\]]*)"?\]([\s\S]*?)\[\/FONT\]/gi, (_match, font, content) => {
    return `<span style="font-family: ${font}, Verdana, Geneva, sans-serif;">${content}</span>`;
  });

  // 10. Sizes (XenForo 1..7)
  const sizeMap: Record<string, string> = {
    '1': '10px',
    '2': '12px',
    '3': '13px',
    '4': '14px',
    '5': '16px',
    '6': '20px',
    '7': '24px'
  };
  for (let i = 0; i < 2; i++) {
    html = html.replace(/\[SIZE="?([0-9]+(?:px)?)"?\]([\s\S]*?)\[\/SIZE\]/gi, (_match, size, content) => {
      const px = sizeMap[size] || (size.endsWith('px') ? size : '14px');
      return `<span style="font-size: ${px};">${content}</span>`;
    });
  }

  // 11. Links (Safe protocols only: http, https, mailto, relative)
  const isSafeUrl = (url: string) => {
    const clean = url.trim().toLowerCase();
    return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('mailto:') || clean.startsWith('#') || clean.startsWith('/');
  };

  html = html.replace(/\[URL="?([^"\]]*)"?\]([\s\S]*?)\[\/URL\]/gi, (_match, url, text) => {
    const clean = url.trim();
    if (!isSafeUrl(clean)) return text;
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${text}</a>`;
  });
  html = html.replace(/\[URL\]([\s\S]*?)\[\/URL\]/gi, (_match, url) => {
    const clean = url.trim();
    if (!isSafeUrl(clean)) return clean;
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${clean}</a>`;
  });

  // 12. Tables (XenForo [TABLE], [TR], [TH], [TD])
  html = html.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/gi, '<div style="overflow-x: auto; margin: 12px 0;"><table style="width: 100%; border-collapse: collapse; border: 1px solid rgba(255,255,255,0.15); font-size: 13px;">$1</table></div>');
  html = html.replace(/\[TR\]([\s\S]*?)\[\/TR\]/gi, '<tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">$1</tr>');
  html = html.replace(/\[TH\]([\s\S]*?)\[\/TH\]/gi, '<th style="padding: 8px 12px; background: rgba(236,199,129,0.15); color: #ecc781; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); text-align: left;">$1</th>');
  html = html.replace(/\[TD\]([\s\S]*?)\[\/TD\]/gi, '<td style="padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1);">$1</td>');

  // 13. Lists (Bulleted and Numbered)
  html = html.replace(/\[LIST=1\]([\s\S]*?)\[\/LIST\]/gi, (_match, content) => {
    const items = content.split(/\[\*\]/gi).filter((s: string) => s.trim().length > 0);
    return `<ol style="margin: 8px 0; padding-left: 24px; list-style-type: decimal;">${items.map((it: string) => `<li style="margin: 3px 0;">${it.trim()}</li>`).join('')}</ol>`;
  });
  html = html.replace(/\[LIST\]([\s\S]*?)\[\/LIST\]/gi, (_match, content) => {
    const items = content.split(/\[\*\]/gi).filter((s: string) => s.trim().length > 0);
    return `<ul style="margin: 8px 0; padding-left: 24px; list-style-type: disc;">${items.map((it: string) => `<li style="margin: 3px 0;">${it.trim()}</li>`).join('')}</ul>`;
  });

  // 14. Code & Monospace
  html = html.replace(/\[CODE\]([\s\S]*?)\[\/CODE\]/gi, '<pre style="background: rgba(0,0,0,0.5); padding: 10px 14px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); margin: 8px 0;"><code>$1</code></pre>');
  html = html.replace(/\[ICODE\]([\s\S]*?)\[\/ICODE\]/gi, '<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #ecc781; font-size: 12px;">$1</code>');

  // 15. Subscript & Superscript
  html = html.replace(/\[SUB\]([\s\S]*?)\[\/SUB\]/gi, '<sub>$1</sub>');
  html = html.replace(/\[SUP\]([\s\S]*?)\[\/SUP\]/gi, '<sup>$1</sup>');

  // 16. Horizontal rules
  html = html.replace(/\[HR\]/gi, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 16px 0;" />');

  // 17. Clean up linebreaks
  html = html.replace(/\r?\n/g, '<br />');

  // Remove unnecessary double line breaks around blocks
  html = html.replace(/(<\/div>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<div)/gi, '$1');
  html = html.replace(/(<\/details>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<details)/gi, '$1');
  html = html.replace(/(<\/table>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<table)/gi, '$1');
  html = html.replace(/(<\/tr>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<tr)/gi, '$1');
  html = html.replace(/(<\/ul>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<ul)/gi, '$1');
  html = html.replace(/(<\/ol>)<br \/>/gi, '$1');
  html = html.replace(/<br \/>(<ol)/gi, '$1');

  return html;
}
