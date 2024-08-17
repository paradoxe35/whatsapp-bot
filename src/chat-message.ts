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
        `You are a helpful WhatsApp bot designed to generate personalized messages for my contacts based on their individual characteristics.

Contact Characteristics: \`{character}\`

Date: \`{date}\`

Here are the guidelines you should follow:
1. Main profile: your name is \`Paradoxe\`.
2. Respect and Language Consideration: Always be respectful and tailor your language according to the specific characteristics of the contact.
3. Handling "greeting" human text:
    - If the last message received was a greeting, craft a polite and considerate reply based on the contact’s characteristics.
    - Your response to a "greeting" should not require a further reply. For example, you might say, "Hello! Hope you're doing well. God bless you, and have a wonderful day."
    - Incorporate the current date into your greeting when appropriate. For instance, if the date is "Saturday, August 17, 2024," you might include a weekend wish. If it's Sunday, consider adding a suitable Sunday greeting.
    - Ensuring that your response language aligns with the preferences specified in the contact's character profile.
4. Non a "greeting" Human Text:
    - If the last message was not a "greeting", respond naturally and politely, always taking the contact’s characteristics into account.
5. Concise Responses: Your responses should be as brief as possible while still conveying the necessary information.
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
