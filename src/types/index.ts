export interface Item {
  id: string;
  text: string;
  completed: boolean;
  state?: "unresolved" | "ongoing" | "completed";
  sectionId?: string;
}

export interface Section {
  id: string;
  name: string;
  order: number;
}

export interface Todo {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface ListSettings {
  threeStageMode: boolean;
  defaultSort: "manual" | "alphabetical" | "completed";
  calendarStartTime?: string;
  calendarEndTime?: string;
  pinned?: boolean;
  isResettable?: boolean;
  hideCompleted?: boolean;
  isAIGenerated?: boolean;
  aiPrompt?: string;
}

export interface List {
  id: string;
  name: string;
  items: Item[];
  sections?: Section[];
  categoryId: string;
  order?: number;
  settings?: ListSettings;
  lastAccessedAt?: string;
  archived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  order?: number;
}

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  files?: {
    status: string;
    path: string;
  }[];
}

export interface ExecutionSession {
  id: string;
  name: string;
  listIds: string[];
  createdAt: string;
  completedAt?: string;
  categoryId?: string;
}

export interface ListCombination {
  id: string;
  name: string;
  listIds: string[];
  createdAt: string;
  updatedAt?: string;
}
