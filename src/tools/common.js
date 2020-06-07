import * as AnsiUp from 'ansi_up';
import fecha from 'fecha';

const ansiUp = new AnsiUp.default(); // eslint-disable-line new-cap
ansiUp.use_classes = true;
ansiUp.escape_for_html = false;

// https://github.com/component/escape-html/blob/master/index.js#L22
const escapeHtml = html => String(html)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const formatLine = (line) => {
  const result = Object.assign({}, line);
  let content = result.content || '';
  result.isJSON = false;

  if (result.type === 'object') {
    content = JSON.stringify(content, null, '  ');
    result.isJSON = true;
  } else if (content) {
    content = ansiUp.ansi_to_html(escapeHtml(content));
  }

  result.html = content;
  result.uid = `${Date.now()}${line.timestamp}${~~(Math.random() * 10000)}`;
  result.dateString = fecha.format(new Date(line.timestamp), 'MM/DD/YY hh:mm:ss');

  return result;
};

export { formatLine, escapeHtml };

