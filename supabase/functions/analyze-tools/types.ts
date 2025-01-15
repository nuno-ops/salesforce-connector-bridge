export interface Tool {
  name: string;
  lastUsed: string;
  useCount: number;
}

export type ToolsList = Tool[];

export interface Category {
  category: string;
  tools: string[];
  action: string;
  potentialSavings: string;
}

export interface Analysis {
  categories: Category[];
}

export type OpenAIResponse = Analysis;