/** PRD 5: at least 10 characters, including at least 1 number and 1 letter. */
export function isValidPassword(password: string): boolean {
  return password.length >= 10 && /[0-9]/.test(password) && /[A-Za-z]/.test(password);
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}
