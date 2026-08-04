const USERNAME_DOMAIN = "manicomiogym.local";

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9._-]/g, "");
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_DOMAIN}`;
}

export function isEmail(input: string): boolean {
  return input.includes("@") && !input.endsWith(`@${USERNAME_DOMAIN}`);
}
