import { z } from "zod";

export class Contact {
  constructor(
    public readonly name: string,
    public readonly phone: string,
    public readonly character: string,
    public readonly schedule: "weekly" | "daily" | "monthly",
    public readonly prompt?: string,
    public readonly autoReply?: boolean
  ) {}

  static fromJson(data: any) {
    const schema = z.object({
      name: z.string(),
      phone: z
        .string()
        .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/i),
      character: z.string().min(5),
      prompt: z.string().optional(),
      autoReply: z.boolean().optional(),
      schedule: z.enum(["weekly", "daily"]).default("weekly"),
    });

    const value = schema.parse(data);

    return new this(
      value.name,
      value.phone,
      value.character,
      value.schedule,
      value.prompt,
      value.autoReply
    );
  }
}
