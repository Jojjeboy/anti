export interface Item {
    id: string;
    text: string;
    completed: boolean;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    priority: 'low' | 'medium' | 'high';
}

export interface List {
    id: string;
    name: string;
    items: Item[];
    categoryId: string;
    order?: number;
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
}
