export type UiMessages = Readonly<Record<string, string>>;

export function pick(messages: UiMessages, key: string): string {
  const v = messages[key];
  return v !== undefined && v !== "" ? v : key;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
