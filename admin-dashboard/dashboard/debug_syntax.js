const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('src/App.jsx', 'utf8');
const Parser = acorn.Parser.extend(jsx());

try {
  Parser.parse(code, {
    ecmaVersion: 2020,
    sourceType: 'module',
  });
  console.log('No syntax errors found.');
} catch (err) {
  console.error(`Syntax Error: ${err.message}`);
  console.error(`At line ${err.loc.line}, column ${err.loc.column}`);
}
