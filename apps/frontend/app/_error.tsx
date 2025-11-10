/**
 * Custom _error page to prevent static generation issues
 * This file disables static generation for error pages (404, 500)
 */

// Disable static generation for error pages
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export default function Custom404() {
  return null; // Will fallback to default Next.js error page
}
