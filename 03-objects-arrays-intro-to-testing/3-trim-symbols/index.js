/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (typeof size !== "number") return string;

  const letters = string.split("");
  const result = [];

  let currentLastLetter = letters[0];
  let currentStackSize = 0;

  letters.forEach((letter) => {
    if (letter === currentLastLetter) {
      currentStackSize += 1;
    } else {
      currentStackSize = 1;
    }

    if (currentStackSize <= size) {
      result.push(letter);
    }

    currentLastLetter = letter;
  });

  return result.join("");
}
