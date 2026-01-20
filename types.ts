
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  COACH = 'COACH'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for secure login
  role: UserRole;
  status: 'active' | 'blocked';
  enrolledCourses: string[]; // Course IDs for quick lookup
  avatar?: string;
}

export interface Cohort {
  id: string;
  courseId: string;
  name: string;
  year: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  cohortId: string;
  enrolledAt: string;
  expiresAt: string; // ISO String
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'link' | 'image';
  downloadable: boolean; // Admin controls if student can download or just view
}

export interface Worksheet {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  templateUrl?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  videoUrl: string;
  duration: string;
  textNotes: string;
  attachments: Attachment[];
  worksheet?: Worksheet; // Every lesson can have a worksheet requirement
  videoDownloadable?: boolean; // Control if the video itself can be downloaded
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  visibility: 'public' | 'private';
  modules: Module[];
  createdAt: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  completedLessons: string[]; // Lesson IDs
  submittedWorksheets: string[]; // Lesson IDs (where worksheet was submitted)
}

export interface Submission {
  id: string;
  worksheetId: string;
  userId: string;
  lessonId: string;
  textAnswer: string;
  status: 'submitted' | 'under_review' | 'approved' | 'needs_changes';
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  courseId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'question' | 'win' | 'resource' | 'help';
  title: string;
  body: string;
  likes: number;
  commentsCount: number;
  pinned: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  courseId?: string;
  title: string;
  body: string;
  createdAt: string;
}
