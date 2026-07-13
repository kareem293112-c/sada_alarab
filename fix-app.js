import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startMarker = '{/* Drawer Chat messages area */}';
const startIndex = content.indexOf(startMarker); // this is the first occurrence (in part1)
console.log("startIndex:", startIndex);

// We need to find the SECOND occurrence of startMarker, which will be in part2
const secondStartIndex = content.indexOf(startMarker, startIndex + 1);
console.log("secondStartIndex:", secondStartIndex);

// The original file is part1 + (the file from secondStartIndex onwards)
if (secondStartIndex !== -1) {
  const original = content.slice(0, startIndex) + content.slice(secondStartIndex);
  fs.writeFileSync('src/App.tsx.recovered', original);
  console.log("Recovered file written to src/App.tsx.recovered");
  console.log("Length:", original.length);
}
