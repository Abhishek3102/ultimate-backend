import stringSimilarity from "string-similarity";

const input = "JPMC";
const existing = [
  "Goldman Sachs",
  "Microsoft",
  "jp morgan",
  "J.P. Morgan & Co.",
];

const match = stringSimilarity.findBestMatch(input, existing);
console.log(match.bestMatch);
