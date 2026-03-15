export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export const INITIAL_VOID_STATE: ActionResult<void> = { success: false, error: "" };

export const FORM_MODE = { CREATE: "create", EDIT: "edit" } as const;
export type FormMode = (typeof FORM_MODE)[keyof typeof FORM_MODE];

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
