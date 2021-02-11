export function calculateAge(timestamp) {
  const date = new Date();
  const date2 = new Date(timestamp);
  let diffTime = Math.abs(date - date2) / (1000 * 60 * 60 * 24 * 30);
  if (Math.floor(diffTime) === 0) {
    diffTime = Math.abs(date - date2) / (1000 * 60 * 60 * 24) - 1;
    if (Math.floor(diffTime) < 1) {
      diffTime = Math.abs(date - date2) / (1000 * 60 * 60);
      if (Math.floor(diffTime) === 0) {
        diffTime = Math.abs(date - date2) / (1000 * 60);
        if (Math.floor(diffTime) === 0) {
          diffTime = Math.abs(date - date2) / 1000;
          return Math.floor(diffTime) + 's';
        } else return Math.floor(diffTime) + 'm';
      } else return Math.floor(diffTime) + 'h';
    } else return Math.floor(diffTime + 1) + 'd';
  } else return Math.floor(diffTime) + 'M';
}

const ageReplacer = a => {
  const date = a.slice(-1);
  if (date === 's') return a.slice(0, -1) / (1000 * 60 * 60 * 24 * 30);
  else if (date === 'm') return a.slice(0, -1) / (60 * 60 * 24 * 30);
  else if (date === 'h') return a.slice(0, -1) / (60 * 24 * 30);
  else if (date === 'd') return a.slice(0, -1) / (24 * 30);
  return a.slice(0, -1);
};

export function compareAge(a, b) {
  a = ageReplacer(a);
  b = ageReplacer(b);
  return a - b;
}
