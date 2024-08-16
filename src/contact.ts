import { z } from "zod";

export class Contact {
  constructor(
    public readonly name: string,
    public readonly phone: string,
    public readonly character: string,
    public readonly prompt?: string
  ) {}

  static fromJson(data: any) {
    const schema = z.object({
      name: z.string(),
      phone: z.string().regex(new RegExp("^(?(d{3}))?[- ]?(d{3})[- ]?(d{4})$")),
      character: z.string().min(5),
      prompt: z.string().optional(),
    });

    const value = schema.parse(data);

    return new this(value.name, value.phone, value.character, value.prompt);
  }
}
