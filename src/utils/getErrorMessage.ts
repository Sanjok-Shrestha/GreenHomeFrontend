import axios from "axios";

/**
 * Safely extract an error message from unknown error values.
 * Handles AxiosError, native Error, and falls back to sensible stringification.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const respData = (error.response?.data as any) || {};
    return (
      respData?.message ||
      respData?.error ||
      error.message ||
      error.response?.statusText ||
      "Request failed"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  try {
    return typeof error === "string" ? error : JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export default getErrorMessage;