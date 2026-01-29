
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, Progress, UserRole, Submission, CommunityPost, Announcement, Worksheet, Lesson, Cohort, Enrollment,WorksheetLibraryItem, WorksheetRequest } from './types';
import { INITIAL_POSTS } from './constants';
import { API } from './services/db';

interface LMSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  users: User[];
  courses: Course[];
  progress: Progress[];
  submissions: Submission[];
  posts: CommunityPost[];
  announcements: Announcement[];
  cohorts: Cohort[];
  enrollments: Enrollment[];
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  markLessonComplete: (courseId: string, lessonId: string) => Promise<void>;
  submitWorksheet: (courseId: string, lessonId: string, text: string) => Promise<void>;
  enrollUser: (userId: string, courseId: string, cohortId: string, durationDays: number) => Promise<void>;
  revokeEnrollment: (enrollmentId: string) => Promise<void>;
  addCohort: (cohort: Omit<Cohort, 'id' | 'createdAt'>) => Promise<void>;
  deleteCohort: (cohortId: string) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  addLesson: (courseId: string, moduleId: string, lesson: Lesson) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addAnnouncement: (title: string, body: string, courseId?: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  worksheets: WorksheetLibraryItem[];
  worksheetRequests: WorksheetRequest[];

  addWorksheet: (title: string, body: string, url?: string) => Promise<void>;
  deleteWorksheet: (id: string) => Promise<void>;

  addWorksheetRequest: (note: string) => Promise<void>;
  setWorksheetRequestStatus: (id: string, status: 'open' | 'fulfilled') => Promise<void>;
  deleteWorksheetRequest: (id: string) => Promise<void>;


  // Logic
  isLessonLocked: (courseId: string, lessonId: string) => boolean;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  isWorksheetSubmitted: (courseId: string, lessonId: string) => boolean;
  isAccessExpired: (courseId: string) => boolean;
  isCourseCompleted: (courseId: string) => boolean;
  getDaysRemaining: (courseId: string) => number;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [posts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetLibraryItem[]>([]);
  const [worksheetRequests, setWorksheetRequests] = useState<WorksheetRequest[]>([]);



  // Initial Sync from "Cloud"
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [u, c, p, s, coh, en,ann,ws,wr] = await Promise.all([
          API.fetchUsers(),
          API.fetchCourses(),
          API.fetchProgress(),
          API.fetchSubmissions(),
          API.fetchCohorts(),
          API.fetchEnrollments(),
          API.fetchAnnouncements(),
          API.fetchWorksheets(),
          API.fetchWorksheetRequests()
        ]);
        setUsers(u);
        setCourses(c);
        setProgress(p);
        setSubmissions(s);
        setCohorts(coh);
        setEnrollments(en);
        setAnnouncements(ann);
        setWorksheets(ws);
        setWorksheetRequests(wr);

      } catch (err) {
        console.error("Cloud data sync failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);


const login = async (email: string, password: string) => {
  try {
    await API.login(email, password);        // Supabase auth
    const profile = await API.getMeProfile(); // profiles table

    setCurrentUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      avatar: profile.avatar ?? '',
      enrolledCourses: []
    });

    return true;
  } catch (err) {
    console.error("Login failed", err);
    return false;
  }
};



const logout = async () => {
  await API.logout();
  setCurrentUser(null);
};

  const markLessonComplete = async (courseId: string, lessonId: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    const newProgress = [...progress];
    const pIndex = newProgress.findIndex(x => x.userId === currentUser.id && x.courseId === courseId);
    
    let target;
    if (pIndex > -1) {
      if (newProgress[pIndex].completedLessons.includes(lessonId)) {
        setIsSaving(false);
        return;
      }
      target = { ...newProgress[pIndex], completedLessons: [...newProgress[pIndex].completedLessons, lessonId] };
      newProgress[pIndex] = target;
    } else {
      target = { userId: currentUser.id, courseId, completedLessons: [lessonId], submittedWorksheets: [] };
      newProgress.push(target);
    }

    await API.saveProgress(newProgress);
    setProgress(newProgress);
    setIsSaving(false);
  };

  const signup = async (name: string, email: string, password: string) => {
  try {
    const data = await API.signup(name, email, password);

    // If email confirmation is OFF, user is immediately authenticated:
    // we can fetch profile and set currentUser.
    const profile = await API.getMeProfile();

    // Map profile -> User type used by app
    setCurrentUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      avatar: profile.avatar ?? "",
      enrolledCourses: []
    } as any);

    return true;
  } catch (err) {
    console.error("Signup failed", err);
    return false;
  }
};


  const submitWorksheet = async (courseId: string, lessonId: string, text: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      lessonId,
      worksheetId: 'ws-' + lessonId,
      textAnswer: text,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    
    await API.saveSubmission(newSub);
    setSubmissions(prev => [...prev, newSub]);

    const newProgress = [...progress];
    const pIndex = newProgress.findIndex(x => x.userId === currentUser.id && x.courseId === courseId);
    
    if (pIndex > -1) {
      if (!newProgress[pIndex].submittedWorksheets.includes(lessonId)) {
        newProgress[pIndex].submittedWorksheets.push(lessonId);
      }
    } else {
      newProgress.push({ userId: currentUser.id, courseId, completedLessons: [], submittedWorksheets: [lessonId] });
    }

    await API.saveProgress(newProgress);
    setProgress(newProgress);
    setIsSaving(false);
  };

  const addWorksheet = async (title: string, body: string, url?: string) => {
  setIsSaving(true);
  try {
    const created = await API.addWorksheet({ title, body, url });
    setWorksheets(prev => [created, ...prev]);
  } finally {
    setIsSaving(false);
  }
};

const deleteWorksheet = async (id: string) => {
  setIsSaving(true);
  try {
    await API.deleteWorksheet(id);
    setWorksheets(prev => prev.filter(w => w.id !== id));
  } finally {
    setIsSaving(false);
  }
};

const addWorksheetRequest = async (note: string) => {
  setIsSaving(true);
  try {
    const created = await API.addWorksheetRequest(note);
    setWorksheetRequests(prev => [created, ...prev]);
  } finally {
    setIsSaving(false);
  }
};

const setWorksheetRequestStatus = async (id: string, status: 'open' | 'fulfilled') => {
  setIsSaving(true);
  try {
    await API.setWorksheetRequestStatus(id, status);
    setWorksheetRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  } finally {
    setIsSaving(false);
  }
};

const deleteWorksheetRequest = async (id: string) => {
  setIsSaving(true);
  try {
    await API.deleteWorksheetRequest(id);
    setWorksheetRequests(prev => prev.filter(r => r.id !== id));
  } finally {
    setIsSaving(false);
  }
};


  const enrollUser = async (userId: string, courseId: string, cohortId: string, durationDays: number) => {
  setIsSaving(true);
  try {
    const result = await API.addEnrollment(userId, courseId, cohortId, durationDays);

    // update enrollments in state
    const expiry = result.expiresAt;
    const newEn: Enrollment = {
      id: result.id,
      userId,
      courseId,
      cohortId,
      enrolledAt: new Date().toISOString(),
      expiresAt: expiry
    };

    setEnrollments(prev => [...prev, newEn]);

    // OPTIONAL: You can remove this enrolledCourses logic later since enrollments are source of truth
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, enrolledCourses: Array.from(new Set([...(u.enrolledCourses ?? []), courseId])) } : u
    );
    setUsers(updatedUsers);

  } catch (err) {
    console.error("Enroll failed:", err);
    alert("Enroll failed. Check console.");
  } finally {
    setIsSaving(false);
  }
};


  const revokeEnrollment = async (enrollmentId: string) => {
    setIsSaving(true);

    // Find the enrollment we are removing (so we know which user/course to update)
    const toRemove = enrollments.find(e => e.id === enrollmentId);

    await API.removeEnrollment(enrollmentId);

    // Update enrollments state
    const updatedEnrollments = enrollments.filter(e => e.id !== enrollmentId);
    setEnrollments(updatedEnrollments);

    // Also remove course from user's enrolledCourses IF they no longer have any enrollment for that course
    if (toRemove) {
      const stillHasSameCourse = updatedEnrollments.some(
        e => e.userId === toRemove.userId && e.courseId === toRemove.courseId
      );

      if (!stillHasSameCourse) {
        const updatedUsers = users.map(u => {
          if (u.id !== toRemove.userId) return u;
          return { ...u, enrolledCourses: u.enrolledCourses.filter(cid => cid !== toRemove.courseId) };
        });

        setUsers(updatedUsers);

        const targetUser = updatedUsers.find(u => u.id === toRemove.userId);
        if (targetUser) await API.saveUser(targetUser);
      }
    }

    setIsSaving(false);
  };


  // const revokeEnrollment = async (id: string) => {
  //   setIsSaving(true);
  //   await API.removeEnrollment(id);
  //   setEnrollments(prev => prev.filter(e => e.id !== id));
  //   setIsSaving(false);
  // };
  const addAnnouncement = async (title: string, body: string, courseId?: string) => {
  setIsSaving(true);
  try {
    const created = await API.addAnnouncement({ title, body, courseId });
    setAnnouncements(prev => [created, ...prev]);
  } finally {
    setIsSaving(false);
  }
};

const deleteAnnouncement = async (id: string) => {
  setIsSaving(true);
  try {
    await API.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  } finally {
    setIsSaving(false);
  }
};

  const addCohort = async (c: Omit<Cohort, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    const newCohort = { ...c, id: 'coh-' + Date.now(), createdAt: new Date().toISOString() };
    await API.saveCohort(newCohort);
    setCohorts(prev => [...prev, newCohort]);
    setIsSaving(false);
  };

  const deleteCohort = async (id: string) => {
    setIsSaving(true);
    await API.deleteCohort(id);
    setCohorts(prev => prev.filter(c => c.id !== id));
    setEnrollments(prev => prev.filter(e => e.cohortId !== id));
    setIsSaving(false);
  };

  const addCourse = async (c: Course) => {
    setIsSaving(true);
    await API.saveCourse(c);
    setCourses(prev => [...prev, c]);
    setIsSaving(false);
  };
  
  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    setIsSaving(true);
    const current = courses.find(c => c.id === courseId);
    if (current) {
      const updated = { ...current, ...updates };
      await API.saveCourse(updated);
      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
    }
    setIsSaving(false);
  };

  const addLesson = async (courseId: string, moduleId: string, lesson: Lesson) => {
    setIsSaving(true);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const updatedCourse = { 
        ...course, 
        modules: course.modules.map(m => {
          if (m.id !== moduleId) return m;
          const lessons = [...m.lessons, { ...lesson, order: m.lessons.length + 1 }];
          return { ...m, lessons };
        })
      };
      await API.saveCourse(updatedCourse);
      setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
    }
    setIsSaving(false);
  };

  // const addUser = async (userData: Omit<User, 'id'>) => {
  //   setIsSaving(true);
  //   const newUser: User = { ...userData, id: 'u-' + Date.now(), avatar: `https://picsum.photos/seed/${Date.now()}/200` };
  //   await API.saveUser(newUser);
  //   setUsers(prev => [...prev, newUser]);
  //   setIsSaving(false);
  // };
const addUser = async (userData: Omit<User, 'id'>) => {
  setIsSaving(true);
  try {
    // create auth user + profile row via Edge Function
    await API.createUserAsAdmin({
      name: userData.name,
      email: userData.email,
      password: (userData as any).password,   // your form includes password
      role: userData.role as any
    });

    // refresh the users list from DB (so it appears immediately)
    const u = await API.fetchUsers();
    setUsers(u);

  } catch (err) {
    console.error("Create user failed:", err);
    alert("Create user failed. Check console.");
  } finally {
    setIsSaving(false);
  }
};



  const deleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return;
    setIsSaving(true);
    await API.deleteUser(userId); 
    setUsers(prev => prev.filter(u => u.id !== userId));
    setEnrollments(prev => prev.filter(e => e.userId !== userId));
    setIsSaving(false);
  };

  

  const isLessonCompleted = (cId: string, lId: string) => progress.find(p => p.userId === currentUser?.id && p.courseId === cId)?.completedLessons.includes(lId) || false;
  const isWorksheetSubmitted = (cId: string, lId: string) => progress.find(p => p.userId === currentUser?.id && p.courseId === cId)?.submittedWorksheets.includes(lId) || false;
  
  const isCourseCompleted = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return false;
    const prog = progress.find(p => p.userId === currentUser?.id && p.courseId === courseId);
    if (!prog) return false;

    const allLessons = course.modules.flatMap(m => m.lessons);
    if (allLessons.length === 0) return false;
    
    const lessonsDone = allLessons.every(l => prog.completedLessons.includes(l.id));
    const lessonsWithWorksheets = allLessons.filter(l => l.worksheet);
    const worksheetsDone = lessonsWithWorksheets.every(l => prog.submittedWorksheets.includes(l.id));

    return lessonsDone && worksheetsDone;
  };

  const isLessonLocked = (courseId: string, lessonId: string) => {
    if (currentUser?.role === UserRole.ADMIN) return false;
    const course = courses.find(c => c.id === courseId);
    if (!course) return true;
    const allLessons = course.modules.flatMap(m => m.lessons).sort((a, b) => a.order - b.order);
    const index = allLessons.findIndex(l => l.id === lessonId);
    if (index === 0) return false; 
    const prevLesson = allLessons[index - 1];
    const prevCompleted = isLessonCompleted(courseId, prevLesson.id);
    const prevWorksheetDone = prevLesson.worksheet ? isWorksheetSubmitted(courseId, prevLesson.id) : true;
    return !(prevCompleted && prevWorksheetDone);
  };

  const isAccessExpired = (courseId: string) => {
    if (currentUser?.role === UserRole.ADMIN) return false;
    const en = enrollments.find(e => e.userId === currentUser?.id && e.courseId === courseId);
    return en ? new Date() > new Date(en.expiresAt) : true;
  };

  const getDaysRemaining = (courseId: string) => {
    if (!currentUser) return 0;
    const enrollment = enrollments.find(e => e.userId === currentUser.id && e.courseId === courseId);
    if (!enrollment) return 0;
    const diff = new Date(enrollment.expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <LMSContext.Provider value={{
      currentUser, setCurrentUser, users, signup, courses, progress, submissions, posts, announcements,addAnnouncement,deleteAnnouncement, cohorts, enrollments,
      isLoading, isSaving,worksheets, worksheetRequests,
      login, logout, markLessonComplete, submitWorksheet, enrollUser, revokeEnrollment, addCohort, deleteCohort, addCourse, updateCourse, addLesson, addUser, deleteUser,
      isLessonLocked, isLessonCompleted, isWorksheetSubmitted, isAccessExpired, isCourseCompleted, getDaysRemaining,   addWorksheet, deleteWorksheet, addWorksheetRequest, setWorksheetRequestStatus, deleteWorksheetRequest,
    }}>
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) throw new Error('useLMS must be used within an LMSProvider');
  return context;
};
