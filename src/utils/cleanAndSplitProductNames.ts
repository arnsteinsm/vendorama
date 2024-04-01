/**
 * Cleans and splits a string of product names separated by semicolons into an array of cleaned product names.
 * @param produktnavn The string containing product names separated by semicolons.
 * @returns An array of cleaned product names.
 */
export function cleanAndSplitProductNames(produktnavn: string): string[] {
  if (!produktnavn) {
    return [];
  }
  // Split the string by semicolons, then clean and trim each product name
  return (
    produktnavn
      .split(";")
      .map((name) =>
        name
          // Remove volume, weight, and other numeric information, but keep percentages
          .replace(/(\d+(\.\d+)?(?!\d*%)\w*)/g, "")
          // Trim whitespace and remove trailing punctuation
          .trim()
          .replace(/[.,]$/g, ""),
      )
      // Filter out any empty strings that may result from the cleaning process
      .filter((name) => name !== "")
  );
}
