// Emails allowed to use the dev tier switcher. Server routes must check this
// list — never trust a client-side flag for it.
export const DEV_EMAILS = ['dev@controva.co']

export function isDevAccount(email: string | null | undefined): boolean {
  return !!email && DEV_EMAILS.includes(email.toLowerCase())
}
