export function getDisplayName(value: any, index = 0): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    const v = value[index];
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.name ?? String(v);
    return String(v);
  }
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.name ?? String(value);
  return String(value);
}

export function getDisplayId(value: any, index = 0): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    const v = value[index];
    if (v == null) return "";
    if (typeof v === "object") return v.id ?? String(v);
    return String(v);
  }
  if (typeof value === "object") return value.id ?? String(value);
  return String(value);
}
