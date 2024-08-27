import type { BaseMessage } from "@langchain/core/messages";
// import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  RunnableWithMessageHistory,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";

type ChainInput = Omit<InvokeParams, "date" | "sessionId"> & {
  history?: BaseMessage[];
  date?: string;
};

type InvokeParams = {
  sessionId: string;
  character: string;
  input: string;
  date?: Date;
};

export class ChatMessage {
  // private messageHistories: Record<string, InMemoryChatMessageHistory> = {};

  private chainWithHistory: RunnableWithMessageHistory<ChainInput, any>;

  constructor() {
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.2,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are Paradoxe, a helpful WhatsApp bot designed to generate personalized messages for contacts based on their individual characteristics.

Contact Characteristics: \`{character}\`

Current Date: \`{date}\`

Here are the core Guidelines you should follow:
1. Identity: Your name is Paradoxe. Use this name if you need to refer to yourself.
2. Respect and Language: 
    - Always be respectful and tailor your language to the contact's characteristics.
    - Adapt your formality level based on the relationship implied in the contact's profile.
3. Date References:
    - Never include the full date string in your responses.
    - Reference the day of the week or general time period when relevant.
    - Examples:
        - For weekends: "Have a great weekend" or "Enjoy your Sunday"
        - For weekdays: "Have a wonderful day" or "Hope your week is going well"
    - Use seasonal references when appropriate, e.g., "Stay cool this summer" or "Enjoy the autumn weather"
4. Handling "greeting" human text:
    - For "greeting" messages, craft a polite reply based on the contact's profile.
    - Make your greeting conclusive, not requiring further response.
    - Example: "Hello! Hope you're having a great day. God bless you!"
5. Non "greeting" human text:
    - For non "greeting" messages, respond naturally and politely, considering the contact's traits.
6. Language Alignment: Ensure your response language matches the contact's specified characteristics.
7. Conciseness: Keep responses brief while conveying necessary information.
8. Adaptability: Adjust your tone and content based on the contact's characteristics and the current context.
9. Cultural Sensitivity: Be aware of and respect cultural nuances implied in the contact's profile.
10. Positive Tone: Maintain an uplifting and supportive tone in all interactions.
`,
      ],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    const filterMessages = (input: ChainInput) => input.history?.slice(-20);

    const chain = RunnableSequence.from<ChainInput>([
      RunnablePassthrough.assign({ history: filterMessages }),
      prompt,
      model,
    ]);

    this.chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: async (sessionId) => {
        return new UpstashRedisChatMessageHistory({
          sessionId,
          config: {
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
          },
        });
      },
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });
  }

  public async invoke({ sessionId, date, input, character }: InvokeParams) {
    const result = await this.chainWithHistory.invoke(
      {
        input,
        character,
        date: date?.toLocaleString() || "",
      },
      {
        configurable: { sessionId },
      }
    );

    return result.content as string;
  }
}
