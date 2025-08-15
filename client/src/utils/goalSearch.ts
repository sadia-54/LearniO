// src/utils/goalSearch.ts
import { Goal } from "../types/Goal"; 

export interface SearchFilters {
  searchTerm: string;
}

export function filterGoals(goals: Goal[], filters: SearchFilters): Goal[] {
  let results = goals;

  // Text search only
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    results = results.filter(goal =>
      goal.title.toLowerCase().includes(searchLower) ||
      (goal.description && goal.description.toLowerCase().includes(searchLower))
    );
  }

  return results;
}
