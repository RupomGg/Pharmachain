/**
 * Calculates total units from a composition string.
 * Example: "5 Strips x 10 Caps" -> 50
 * Logic: Multiplies all numbers found in the string.
 * @param {String} str 
 * @returns {Number}
 */
export const calculateTotalUnits = (str) => {
  if (!str) return 1;
  const numbers = str.match(/\d+/g); // Finds ["5", "10"]
  return numbers ? numbers.reduce((acc, num) => acc * parseInt(num), 1) : 1;
};
