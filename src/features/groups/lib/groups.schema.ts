import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(100, { error: "Name must be at most 100 characters" }),
  description: z
    .string()
    .max(500, { error: "Description must be at most 500 characters" })
    .optional(),
  currency: z
    .string()
    .length(3, { error: "Currency must be a 3-letter code" }),
});

export const updateGroupSchema = createGroupSchema.extend({
  id: z.string().min(1, { error: "Group ID is required" }),
});

export const inviteMemberSchema = z.object({
  groupId: z.string().min(1, { error: "Group ID is required" }),
  email: z.email({ error: "Invalid email address" }),
});

export const changeRoleSchema = z.object({
  groupId: z.string().min(1, { error: "Group ID is required" }),
  memberId: z.string().min(1, { error: "Member ID is required" }),
  role: z.enum(["ADMIN", "MEMBER"], {
    error: "Role must be ADMIN or MEMBER",
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
