import axios from "axios";

type ApiErrorBody = {
  success?: boolean;
  errorCode?: string | number;
  message?: unknown;
  status?: string;
  timestamp?: string;
  errors?: Record<string, string | string[]>;
};

function formatFieldErrors(errors?: ApiErrorBody["errors"]) {
  if (!errors) return "";

  return Object.entries(errors)
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(", ") : value;
      return `${field}: ${text}`;
    })
    .join("\n");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const message = typeof data?.message === "string" ? data.message : "";
    const fieldErrors = formatFieldErrors(data?.errors);

    return [message, fieldErrors].filter(Boolean).join("\n") || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
