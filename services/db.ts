
import { User, Course, Progress, Submission, Cohort, Enrollment, CommunityPost } from '../types';
import { INITIAL_USERS, INITIAL_COURSES, INITIAL_POSTS } from '../constants';

/**
 * VRT MANAGEMENT CLOUD - CORE BACKEND SERVICE
 * 
 * To deploy for real customers:
 * 1. Replace localStorage calls with fetch() or SDK calls (Supabase/Firebase).
 * 2. Implement real JWT token validation in the login() method.
 */
class VRTCloudAPI {
  private simulateLatency = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

  // --- IDENTITY & AUTH ---
  async login(email: string, password: string): Promise<User | null> {
    await this.simulateLatency(800);
    const users = this.getData<User[]>('lms_users') || INITIAL_USERS;
    const user = users.find(u => u.email === email && u.password === password && u.status === 'active');
    return user ? { ...user } : null;
  }

  // --- DATA PERSISTENCE ---
  private getData<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private saveData<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- COURSES & CURRICULUM ---
  async fetchCourses(): Promise<Course[]> {
    await this.simulateLatency(1200);
    return this.getData<Course[]>('lms_courses') || INITIAL_COURSES;
  }

  async saveCourse(course: Course): Promise<Course> {
    await this.simulateLatency(1000);
    const courses = await this.fetchCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index > -1) {
      courses[index] = course;
    } else {
      courses.push(course);
    }
    this.saveData('lms_courses', courses);
    return course;
  }

  // --- USERS & ENROLLMENTS ---
  async fetchUsers(): Promise<User[]> {
    await this.simulateLatency(1000);
    return this.getData<User[]>('lms_users') || INITIAL_USERS;
  }

  async saveUser(user: User): Promise<User> {
    await this.simulateLatency(800);
    const users = await this.fetchUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) users[index] = user;
    else users.push(user);
    this.saveData('lms_users', users);
    return user;
  }

  // Added deleteUser method to handle partner removal from persistent storage
  async deleteUser(userId: string): Promise<void> {
    await this.simulateLatency(800);
    const users = await this.fetchUsers();
    this.saveData('lms_users', users.filter(u => u.id !== userId));
  }

  async fetchEnrollments(): Promise<Enrollment[]> {
    await this.simulateLatency(500);
    return this.getData<Enrollment[]>('lms_enrollments') || [];
  }

  async addEnrollment(en: Enrollment): Promise<void> {
    await this.simulateLatency(600);
    const current = await this.fetchEnrollments();
    this.saveData('lms_enrollments', [...current, en]);
  }

  async removeEnrollment(id: string): Promise<void> {
    await this.simulateLatency(500);
    const current = await this.fetchEnrollments();
    this.saveData('lms_enrollments', current.filter(e => e.id !== id));
  }

  // --- COHORTS ---
  async fetchCohorts(): Promise<Cohort[]> {
    await this.simulateLatency(700);
    return this.getData<Cohort[]>('lms_cohorts') || [];
  }

  async saveCohort(coh: Cohort): Promise<void> {
    const current = await this.fetchCohorts();
    this.saveData('lms_cohorts', [...current, coh]);
  }

  async deleteCohort(id: string): Promise<void> {
    const current = await this.fetchCohorts();
    this.saveData('lms_cohorts', current.filter(c => c.id !== id));
  }

  // --- PROGRESS ---
  async fetchProgress(): Promise<Progress[]> {
    await this.simulateLatency(400);
    return this.getData<Progress[]>('lms_progress') || [];
  }

  async saveProgress(p: Progress[]): Promise<void> {
    this.saveData('lms_progress', p);
  }

  // --- SUBMISSIONS ---
  async fetchSubmissions(): Promise<Submission[]> {
    await this.simulateLatency(400);
    return this.getData<Submission[]>('lms_submissions') || [];
  }

  async saveSubmission(sub: Submission): Promise<void> {
    const current = await this.fetchSubmissions();
    this.saveData('lms_submissions', [...current, sub]);
  }
}

export const API = new VRTCloudAPI();


