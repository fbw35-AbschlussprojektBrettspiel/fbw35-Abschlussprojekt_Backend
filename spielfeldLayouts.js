// Spielfeld-Array. Die Elemente repräsentieren die Feldtypen
const standardLayout = Array(61)
  .fill(null)
  .map((_, index) =>
    (index - 1) % 4 === 0
      ? 'html'
      : (index - 1) % 4 === 1
      ? 'css'
      : (index - 1) % 4 === 2
      ? 'javascript'
      : (index - 1) % 4 === 3
      ? 'aktion'
      : 'startfeld'
  );

const demoLayout = [
  'startfeld',
  'html',
  'css',
  'javascript',
  'html',
  'css',
  'aktion',
  'aktion',
  'aktion',
  'aktion',
  'aktion',
  'aktion',
  'javascript',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'aktion',
  'html',
  'css',
  'javascript',
  'css',
  'html',
  'css',
  'javascript',
  'html',
];

module.exports = { standardLayout, demoLayout };
