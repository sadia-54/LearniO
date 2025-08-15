// src/types/Goal.ts
export interface Goal {
  goal_id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  start_date: string;
  end_date: string;
  status?: string;
}
