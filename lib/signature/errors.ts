// E1 failures of the signature step (W02C). Shown with STRINGS.signature.figmaError / .failed.
export type SignatureErrorCode = "FIGMA_UNSUPPORTED" | "NO_TEXT" | "FETCH_FAILED" | "UNREADABLE";

export class SignatureError extends Error {
  constructor(readonly code: SignatureErrorCode, message: string) {
    super(message);
  }
}

/** Below this much text a source is treated as unreadable (scanned PDF, empty page). */
export const MIN_TEXT_CHARS = 200;
