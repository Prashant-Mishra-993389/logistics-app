const fs = require('fs');

const code = fs.readFileSync('src/App.jsx', 'utf8');

// Find all component definitions (const Name = ( or function Name() )
const compRegex = /(?:const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_0-9]+)\s*=>|function\s+([A-Z][A-Za-z0-9_]*)\s*\()/g;

const components = new Set();
let match;
while ((match = compRegex.exec(code)) !== null) {
  const name = match[1] || match[2];
  components.add(name);
}

console.log('Total components found:', components.size);

const unused = [];
for (const comp of components) {
  if (comp === 'App') continue; // Entry point
  
  // Look for <Comp, <Comp>, <Comp/>, {Comp}, or Comp: (in an object)
  const usage1 = '<' + comp;
  const usage2 = '{' + comp + '}';
  const usage3 = comp + ',';
  const usage4 = '{ ' + comp;
  const usage5 = comp + ':';
  // we count occurrences
  const regex = new RegExp(`\\b${comp}\\b`, 'g');
  const matches = [...code.matchAll(regex)];
  
  // if occurrences == 1 (only the definition), it's definitely unused (unless it's an export, but this is a single file).
  // if occurrences > 1, maybe it's used.
  if (matches.length === 1) {
    unused.push(comp);
  } else {
    // maybe it's only exported or something?
  }
}

console.log('Unused components (0 usages elsewhere):', unused);
