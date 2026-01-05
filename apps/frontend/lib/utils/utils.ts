"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";

  // Create a temporary DOM element to decode HTML entities
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    // Iteratively decode in case the content is double-encoded
    let prev = text;
    let decoded = text;
    for (let i = 0; i < 5; i++) {
      textarea.innerHTML = decoded;
      decoded = textarea.value;
      if (decoded === prev) break;
      prev = decoded;
    }
    return decoded;
  }

  // Fallback for SSR - decode common entities
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#96;/g, "`")
    .replace(/&nbsp;/g, " ");
}

export function prepareRichText(content: string | undefined | null): string {
  if (!content) return "";

  // First decode HTML entities
  const processed = decodeHtmlEntities(content);

  // Check if the content already has HTML tags
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(processed);

  if (hasHtmlTags) {
    // If it already has HTML, we need to sanitize it
    return sanitizeRichHtml(processed);
  } else {
    // If it's plain text, convert markdown to HTML
    return markdownToHtml(processed);
  }
}

function sanitizeRichHtml(html: string): string {
  if (!html) return "";

  // Create a temporary DOM element to parse and sanitize HTML
  if (typeof document === "undefined") {
    // Fallback for SSR - basic sanitization
    return basicSanitize(html);
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // List of allowed tags
  const allowedTags = [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "ins",
    "s",
    "strike",
    "del",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ];

  // Remove script tags and event handlers
  const scripts = tempDiv.querySelectorAll(
    "script, style, iframe, object, embed, form"
  );
  scripts.forEach((el) => el.remove());

  // Remove all event handlers
  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((el) => {
    const attributes = Array.from(el.attributes);
    attributes.forEach((attr) => {
      if (
        attr.name.startsWith("on") ||
        attr.name === "style" ||
        attr.name === "class" ||
        attr.name === "id" ||
        (attr.name === "href" && attr.value.startsWith("javascript:"))
      ) {
        el.removeAttribute(attr.name);
      }
    });

    // Remove disallowed tags
    if (
      !allowedTags.includes(el.tagName.toLowerCase()) &&
      el.tagName.toLowerCase() !== "div" && // div is allowed as container
      el.tagName.toLowerCase() !== "span"
    ) {
      // span is allowed for styling
      // Replace disallowed tag with its content
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      parent?.removeChild(el);
    }
  });

  return tempDiv.innerHTML;
}

function basicSanitize(html: string): string {
  // Basic regex-based sanitization for SSR
  let sanitized = html;

  // Remove script tags
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Remove dangerous tags but keep formatting tags
  const allowedTags = [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "ins",
    "s",
    "strike",
    "del",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ];

  // Remove all tags except allowed ones
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match;
    }
    return "";
  });

  return sanitized;
}

export function markdownToHtml(text: string): string {
  if (!text) return "";

  return (
    text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/__(.+?)__/g, "<b>$1</b>")
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, "<i>$1</i>")
      .replace(/_(.+?)_/g, "<i>$1</i>")
      // Strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, "<s>$1</s>")
      // Underline: ++text++
      .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
      // Line breaks
      .replace(/\n/g, "<br>")
      // Paragraphs (optional)
      .replace(/(<br>\s*){2,}/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
  );
}
