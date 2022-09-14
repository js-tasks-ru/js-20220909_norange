/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  const compareStrings = (string1, string2) => {
    return string1.localeCompare(string2, [], {caseFirst: 'upper'});
  };

  return arr.slice().sort((a, b) => {
    if (param === 'desc') {
      return compareStrings(b, a);
    } else {
      return compareStrings(a, b);
    }
  });
}
