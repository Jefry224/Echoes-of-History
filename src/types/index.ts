// ─── Global Types ─────────────────────────────────────────────────────────────

/** Shorthand for a React component children prop */
export type PropsWithChildren<T = unknown> = T & { children?: React.ReactNode };

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/** Generic paginated response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

/** Generic select option */
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

// ─── Status Types ─────────────────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'light' | 'dark';
