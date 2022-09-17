/**
 * invertObj - should swap object keys and values
 * @param {object} obj - the initial object
 * @returns {object | undefined} - returns new object or undefined if nothing did't pass
 */
const isObject = (obj) => {
  return typeof obj === "object" && obj !== null;
};

export function invertObj(obj) {
  if (!isObject(obj)) return;

  const invertedEntries = Object.entries(obj).map(([key, value]) => {
    return [value, key];
  });

  return Object.fromEntries(invertedEntries);
}
