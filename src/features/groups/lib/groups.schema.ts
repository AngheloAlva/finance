import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, { error: "minLength2" })
    .max(100, { error: "maxLength100" }),
  description: z
    .string()
    .max(500, { error: "maxLength500" })
    .optional(),
  currency: z
    .string()
    .length(3, { error: "currencyLength3" }),
});

export const updateGroupSchema = createGroupSchema.extend({
  id: z.string().min(1, { error: "requiredId" }),
});

export const inviteMemberSchema = z.object({
  groupId: z.string().min(1, { error: "requiredId" }),
  email: z.email({ error: "invalidEmail" }),
});

export const changeRoleSchema = z.object({
  groupId: z.string().min(1, { error: "requiredId" }),
  memberId: z.string().min(1, { error: "requiredId" }),
  role: z.enum(["ADMIN", "MEMBER"], {
    error: "invalidRole",
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
