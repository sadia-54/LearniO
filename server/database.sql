
-- 1. Users
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. StudyGoals
CREATE TABLE StudyGoals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DailyPlans
CREATE TABLE DailyPlans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES StudyGoals(goal_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'done')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tasks
CREATE TABLE Tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES DailyPlans(plan_id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('reading', 'video', 'quiz', 'custom')),
    title TEXT NOT NULL,
    description TEXT,
    resource_url TEXT,
    estimated_duration INTEGER, -- in minutes
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'skipped')),
    completed_at TIMESTAMP
);

-- 5. Quizzes
CREATE TABLE Quizzes (
    quiz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES Tasks(task_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_score INTEGER
);

-- 6. Questions
CREATE TABLE Questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES Quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_option CHAR(1) CHECK (correct_option IN ('A','B','C','D'))
);

-- 7. Answers
CREATE TABLE Answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES Questions(question_id) ON DELETE CASCADE,
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    selected_option CHAR(1) CHECK (selected_option IN ('A','B','C','D')),
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Progress
CREATE TABLE Progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    total_tasks_completed INTEGER DEFAULT 0,
    total_tasks_skipped INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in minutes
    current_streak INTEGER DEFAULT 0,
    last_active_date DATE
);

-- 9. AIRecommendations
CREATE TABLE AIRecommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    task_id UUID REFERENCES Tasks(task_id),
    recommendation_text TEXT NOT NULL,
    recommendation_type TEXT CHECK (recommendation_type IN ('revise', 'advance', 'slow_down', 'repeat_easy')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Achievements
CREATE TABLE Achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Settings
-- Replace old Settings table with updated one
CREATE TABLE Settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    email_reminder BOOLEAN DEFAULT true,
    daily_study_hours INTEGER DEFAULT 2,
    interface_theme TEXT DEFAULT 'light' CHECK (interface_theme IN ('light', 'dark')),

    preferred_time_blocks JSONB DEFAULT '[]', -- e.g., [{"start": "07:00", "end": "10:00"}, {"start": "19:00", "end": "22:00"}]
    weekend_days TEXT[] DEFAULT ARRAY['Saturday', 'Sunday'] -- stored as array of day names
);


CREATE TABLE Notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    task_id UUID REFERENCES Tasks(task_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    notification_type TEXT CHECK (notification_type IN ('reminder', 'alert', 'achievement')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP -- When to send the notification
);