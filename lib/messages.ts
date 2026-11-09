/**
 * Every user-facing message, word for word from the PRD (and Section 18 #9).
 * Never write UI messages inline elsewhere.
 */
export const messages = {
  // PRD 12 error messages
  offline: 'You’re offline. Changes will not be saved.',
  serverError: 'Something went wrong. Try again.',
  loginExpired: 'Please log in again.',
  notAllowed: 'You don’t have access to this.',
  uploadFailed: 'Upload failed. Check your connection.',
  linkExpired: 'This link has expired. Opening it again…',

  // Accounts (PRD 5, US1–US3, Section 18 #9)
  emailTaken: 'This email already has an account. Log in instead?',
  verifyBanner: 'Check your email and tap the link to verify your account.',
  verifyFirst: 'Please verify your email first.',
  tooManyAttempts: 'Too many attempts. Try again in 15 minutes.',
  wrongPassword: 'Incorrect email or password.',
  resetSent: 'If an account exists for this email, we’ve sent a reset link.',
  passwordRule: 'At least 10 characters, including a number and a letter.',
  pinMismatch: 'The PINs don’t match. Try again.',
  wrongPin: (left: number) => `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`,
  tooManyPins: 'Too many wrong PINs. Please log in again.',

  // Documents (BR1, US4, US5)
  fileRejected: 'This file can’t be used. Choose a PDF or photo under 10 MB.',
  noDocumentsFound: 'No documents found.',
  documentLimit: 'You can store up to 200 documents.',
  documentGone: 'This document is no longer available.',
  mediaPermission: 'Allow camera or photo access in your phone settings.',
  documentDeleted: 'Document deleted',

  // Assets (BR3)
  last4Only: 'Enter only the last 4 digits.',
  passwordWarning: 'Don’t store passwords here. Say where they are kept instead.',

  // Trusted contacts (BR4, BR5)
  selfInvite: 'You can’t add yourself.',
  contactLimit: 'You can have up to 5 trusted contacts.',
  duplicateContact: 'This person is already one of your trusted contacts.',
  inviteExpired: 'This invitation has expired. Ask the person to send it again.',
  emergencyLevelNote: 'Can see your emergency profile only, if you share it.',
  noLongerContact: 'You are no longer a trusted contact for this person.',

  // Access requests (BR6–BR8)
  requestOpenElsewhere: 'Someone has already asked for access. You’ll be told when it’s decided.',
  requestReceived: (date: string) =>
    `Request received. We are checking your documents. The waiting period ends on ${date}.`,
  requestRejected: 'We could not verify the documents you sent. Please upload clearer copies.',
  requestCancelledByOwner: 'The account holder has cancelled this request.',
  requestCancelled: 'Request cancelled. Nothing was shared.',
  releasedOn: (date: string) => `Your information was released on ${date}`,
  vaultGone: 'This vault no longer exists.',

  // Home (BR10, BR11, PRD 8.2)
  reviewDue: 'Time to check your information is still up to date.',
  homeEmpty: 'Let’s start with one thing. Most people begin with their ID.',
  sharedWithMe: (n: number) => `You are a trusted contact for ${n} ${n === 1 ? 'person' : 'people'}.`,
  readinessCount: (done: number) => `${done} of 8 done`,

  // Instructions (US9)
  messageOnlyFor: (name: string) => `Only ${name} will see this, and only after release.`,

  saved: 'Saved',
  deleted: 'Deleted',
} as const;

/** Labels and short texts shown on screens, from the PRD. */
export const labels = {
  appName: 'LifeNest',
  pitch:
    'LifeNest helps adults organise documents and instructions in one secure place so that loved ones can find them when needed.',
  getStarted: 'Get started',
  logIn: 'Log in',
  signUp: 'Sign up',
  sendLink: 'Send link',
  resendEmail: 'Resend email',
  forgotPassword: 'Forgot password?',
  forgotPin: 'Forgot PIN?',
  done: 'Done',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  tryAgain: 'Try again',
  view: 'View',
  download: 'Download',
  replaceFile: 'Replace file',
  logOut: 'Log out',
  deleteAccount: 'Delete account',
  changePin: 'Change PIN',
  privacyNotice: 'Privacy Notice',
  is18: 'I am 18 or older',
  agreePrivacy: 'I agree to the Privacy Notice',
  email: 'Email',
  password: 'Password',
  newPassword: 'New password',
  fullName: 'Full name',
  phone: 'Phone (optional)',
  fingerprint: 'Use fingerprint',
  vaultDoor: 'Vault door',
  loading: 'Loading',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  deleteKey: 'Delete',
  useFingerprint: 'Use fingerprint',
  addSomeone: 'Add someone you trust',
  sendInvite: 'Send invite',
  resendInvite: 'Resend invite',
  accept: 'Accept',
  decline: 'Decline',
  remove: 'Remove',
  sharedWithMe: 'Shared with me',
  requestAccess: 'Request access',
  submitRequest: 'Submit request',
  declaration: 'The information I have given is true',
  cancelRequest: 'Cancel request – I’m OK',
  yesCancel: 'Yes, cancel',
  closeAccess: 'Close access',
  everythingUpToDate: 'Everything is up to date',
  reviewNow: 'Review now',
  addIdDocument: 'Add an ID document',
  linkDocument: 'Link a document',
  instruction: 'Instruction',
  personalMessage: 'Personal message',
  shareNow: 'Share now with Emergency contacts',
  instructionsAndMessages: 'Instructions and messages',
  emergencyProfile: 'Emergency profile',
  iDontOwnAny: 'I don’t own any',
  updates: 'Updates',
} as const;
