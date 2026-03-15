import type { ActionResult } from "@/shared/types/common.types";

interface ZodLikeError {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}

export function formatZodErrors(error: ZodLikeError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0]?.toString();
    if (field) {
      fieldErrors[field] = fieldErrors[field] ?? [];
      fieldErrors[field].push(issue.message);
    }
  }

  return { success: false, error: "Please fix the errors below", fieldErrors };
}

export function requireFormId(
  formData: FormData,
  field = "id",
): ActionResult<string> {
  const id = formData.get(field);
  if (typeof id !== "string" || id.length === 0) {
    return { success: false, error: `${field} is required` };
  }
  return { success: true, data: id };
}
