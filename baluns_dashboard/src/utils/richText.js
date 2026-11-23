const ALLOWED = new Set(["DIV", "P", "BR", "IMG", "B", "STRONG", "I", "EM", "UL", "OL", "LI"]);
const HTML_HINT = /<(div|p|br|img|b|i|ul|ol|li|strong|em)[\s>/]/i;

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const looksLikeHtml = (value) => HTML_HINT.test(value);

export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return; // text
      if (child.nodeType !== 1) return child.remove();

      const tag = child.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return child.remove();

      if (!ALLOWED.has(tag)) {
        clean(child);
        return child.replaceWith(...child.childNodes);
      }

      if (tag === "IMG") {
        const src = child.getAttribute("src") || "";
        if (!src.startsWith("data:image/")) return child.remove();
        [...child.attributes].forEach((a) => {
          if (a.name !== "src" && a.name !== "alt") child.removeAttribute(a.name);
        });
        return;
      }

      [...child.attributes].forEach((a) => child.removeAttribute(a.name));
      clean(child);
    });
  };

  clean(doc.body);
  return doc.body.innerHTML;
}

// Old tasks have plain-text descriptions, new ones are saved as HTML
export function toEditorHtml(value) {
  if (!value) return "";
  if (!looksLikeHtml(value)) return escapeHtml(value).replace(/\n/g, "<br>");
  return sanitizeHtml(value);
}

export function descriptionToText(value) {
  if (!value) return "";
  if (!looksLikeHtml(value)) return value;
  const spaced = value.replace(/<(br|\/div|\/p|\/li)[^>]*>/gi, " ");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

export const countImages = (value) => ((value || "").match(/<img/gi) || []).length;