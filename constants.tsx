
import { UserRole, Course, User, CommunityPost } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Sarah Admin',
    email: 'admin@entrelms.com',
    password: 'password123',
    role: UserRole.ADMIN,
    status: 'active',
    enrolledCourses: ['c1', 'c2'],
    avatar: 'https://picsum.photos/seed/admin/200'
  },
  {
    id: '2',
    name: 'John Student',
    email: 'john@student.com',
    password: 'password123',
    role: UserRole.STUDENT,
    status: 'active',
    enrolledCourses: ['c1'],
    avatar: 'https://picsum.photos/seed/student/200'
  },
  {
    id: '3',
    name: 'Mark Coach',
    email: 'mark@coach.com',
    password: 'password123',
    role: UserRole.COACH,
    status: 'active',
    enrolledCourses: ['c1'],
    avatar: 'https://picsum.photos/seed/coach/200'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Entrepreneur Growth Alliance course',
    subtitle: 'The ultimate roadmap for scaling your enterprise.',
    description: 'Master the scaling phase of your business with the Growth Alliance framework. From operations to strategic hiring.',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    category: 'Business Strategy',
    level: 'Intermediate',
    visibility: 'public',
    createdAt: new Date().toISOString(),
    modules: [
      {
        id: 'm1',
        courseId: 'c1',
        title: 'Phase 1: Foundations',
        order: 1,
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'EGA Introduction',
            order: 1,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '05:24',
            textNotes: 'Welcome to the Alliance. This video covers your growth trajectory.',
            attachments: [{ id: 'a1', name: 'Growth Roadmap PDF', url: '#', type: 'pdf', downloadable: true }],
            worksheet: { id: 'ws1', lessonId: 'l1', title: 'Foundational Audit', instructions: 'Submit your current business metrics.' }
          },
          {
            id: 'l2',
            moduleId: 'm1',
            title: 'The Growth Mindset',
            order: 2,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '12:45',
            textNotes: 'Scaling requires a shift in leadership thinking.',
            attachments: [],
            worksheet: { id: 'ws2', lessonId: 'l2', title: 'Leadership Assessment', instructions: 'List your top 3 leadership bottlenecks.' }
          }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'Entrepreneur Excellence course',
    subtitle: 'Achieve peak performance and operational brilliance.',
    description: 'Focus on high-level executive performance, time mastery, and excellence in every aspect of business management.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    category: 'Leadership',
    level: 'Advanced',
    visibility: 'public',
    createdAt: new Date().toISOString(),
    modules: [
       {
        id: 'm2-1',
        courseId: 'c2',
        title: 'Phase 1: Personal Excellence',
        order: 1,
        lessons: [
          {
            id: 'l2-1',
            moduleId: 'm2-1',
            title: 'Excellence Fundamentals',
            order: 1,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '08:15',
            textNotes: 'Introduction to operational excellence.',
            attachments: [],
            worksheet: { id: 'ws-e1', lessonId: 'l2-1', title: 'Excellence Baseline', instructions: 'Define your excellence standard.' }
          }
        ]
      }
    ]
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userId: '2',
    userName: 'John Student',
    type: 'win',
    title: 'Just landed my first client!',
    body: 'Huge thanks to the Growth Alliance framework. It really works!',
    likes: 12,
    commentsCount: 3,
    pinned: false,
    createdAt: new Date().toISOString()
  }
];
