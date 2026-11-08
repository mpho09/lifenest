/**
 * Every user-facing message, word for word from the PRD (and Section 18 #9).
 * Later phases add their messages here; never write UI text inline elsewhere.
 */
export const messages = {
  offline: 'You’re offline. Changes will not be saved.',
  serverError: 'Something went wrong. Try again.',
  loginExpired: 'Please log in again.',
  notAllowed: 'You don’t have access to this.',
  uploadFailed: 'Upload failed. Check your connection.',
  linkExpired: 'This link has expired. Opening it again…',
} as const;

/** Labels and short texts shown on screens, from the PRD. */
export const labels = {
  appName: 'LifeNest',
  pitch:
    'LifeNest helps adults organise documents and instructions in one secure place so that loved ones can find them when needed.',
  getStarted: 'Get started',
  logIn: 'Log in',
  cancel: 'Cancel',
  vaultDoor: 'Vault door',
  loading: 'Loading',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  deleteKey: 'Delete',
  useFingerprint: 'Use fingerprint',
} as const;
