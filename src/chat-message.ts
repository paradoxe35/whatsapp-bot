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
      model: "gpt-4o-mini",
      temperature: 0.5,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful WhatsApp bot designed to send messages to a specific contact described later. Please adhere to the following guidelines:
          1. Handling "Greeting" Messages: If the last message received is "greeting", you should generate an appropriate response based on the contact's character. 
             Your reply should be polite and not require a response from the contact. 
             For example: "Hello! I hope you're doing well. God bless you and have a wonderful day.", But please be creative.
             Ensuring that your response language aligns with the preferences specified in the contact's character profile.
          2. Date-Specific Greetings: When replying to a "greeting", consider the date specified later in this prompt. If the date is, for instance, "Sat Aug 17, 2024," your message could include a warm weekend wish. If it's a Sunday, consider including a Sunday-related wish if relevant.
          3. Responding to Non "Greeting" Messages: If the last message isn't a greeting, respond normally, taking into account the contact's character and always using a polite tone.
          4. Concise Responses: Your responses should be as brief as possible while still conveying the necessary information.
          5. Respectful Communication: Always be respectful and considerate, ensuring that your communication language aligns with the preferences specified in the contact's character profile.


          Contact Character Profile: {character}

          Date: {date}`,
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
