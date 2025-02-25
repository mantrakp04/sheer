import { StoredMessage } from "@langchain/core/messages";

export interface IChatSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
  model: string;
  embedding_model: string;
  enabled_tools: string[];
  python_session_id?: string;
}

export type ToolType = 
  | "calculator" 
  | "python" 
  | "python_repl" 
  | "python_visualization" 
  | "python_data_processing";

export const AVAILABLE_TOOLS: Record<ToolType, { name: string; description: string }> = {
  calculator: {
    name: "Calculator",
    description: "Perform mathematical calculations"
  },
  python: {
    name: "Python",
    description: "Execute Python code with data science libraries"
  },
  python_repl: {
    name: "Python REPL",
    description: "Interactive Python REPL with state persistence"
  },
  python_visualization: {
    name: "Python Visualization",
    description: "Generate visualizations using matplotlib, plotly, etc."
  },
  python_data_processing: {
    name: "Python Data Processing",
    description: "Process data using pandas, numpy, scikit-learn, etc."
  }
};
