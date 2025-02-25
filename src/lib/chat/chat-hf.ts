import { ChatOpenAI } from "@langchain/openai";

export const ChatHFInference = ({
  modelName,
  apiKey
}: {
  modelName: string;
  apiKey: string;
}) => {
  if (!apiKey) {
    throw new Error("Hugging Face API token is required");
  }
  
  return new ChatOpenAI(
    {
      model: modelName,
      apiKey: apiKey,
      configuration: {
        baseURL: "https://api-inference.huggingface.co/v1/"
      }
    },
  );
}