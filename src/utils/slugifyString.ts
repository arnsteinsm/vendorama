import slugify from "slugify";

// Extend slugify with custom replacements
slugify.extend({ "/": "-" });

// Export a function to slugify strings with specific options
export function slugifyString(str: string): string {
  return slugify(str, {
    lower: true,
    strict: true,
    locale: "no",
    remove: /[*+~.()'"!:@]/g,
  });
}
