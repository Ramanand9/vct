import { supabase } from './supabaseClient';
import { Course, Cohort, Enrollment, User, UserRole, Announcement } from '../types';

// helper: requires logged-in session
async function requireSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not authenticated');
  return data.session;
}

async function isAdmin() {
  const session = await requireSession();
  const uid = session.user.id;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();

  if (error) throw error;
  return data.role === 'ADMIN';
}


// export async function createUserAsAdmin(payload: {
//   name: string;
//   email: string;
//   password: string;
//   role: "ADMIN" | "STUDENT" | "COACH";
// }) {
//   const { data, error } = await supabase.functions.invoke("create-user", {
//     body: payload
//   });
//   if (error) throw error;
//   return data;
// }


export const API = {
  // ---------- AUTH ----------
  async login(email: string, password: string) {
    console.log("LOGIN ATTEMPT:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("SUPABASE LOGIN DATA:", data);
    console.log("SUPABASE LOGIN ERROR:", error);

    if (error) throw error;
    return data;
  },

  // services/db.ts
async signup(name: string, email: string, password: string) {
  // 1) Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name } // stored in user_metadata
    }
  });
  if (error) throw error;

  // data.user may be null until email confirmed depending on settings
  return data;
},


  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getMeProfile() {
    const session = await requireSession();
    const uid = session.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) throw error;
    return data;
  },

  async createUserAsAdmin(payload: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "STUDENT" | "COACH";
  }) {
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: payload
    });
    if (error) throw error;
    return data; // { ok: true, userId: "..." }
  },

  // ---------- USERS (ADMIN) ----------
  async fetchUsers(): Promise<User[]> {
    if (!(await isAdmin())) throw new Error('Admin only');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Map profiles -> your User type shape
    return (data ?? []).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as UserRole,
      status: p.status,
      avatar: p.avatar ?? '',
      enrolledCourses: [] // NOTE: enrollments determine access now
    }));
  },

  // Creating users securely usually requires Admin API / Edge Function.
  // For now: keep it simple—create users manually in Supabase Auth dashboard.
  async saveUser(user: Partial<User> & { id: string }) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const { error } = await supabase
      .from('profiles')
      .update({
        name: user.name,
        role: user.role,
        status: (user as any).status,
        avatar: (user as any).avatar
      })
      .eq('id', user.id);
    if (error) throw error;
  },

  // ---------- COURSES ----------

  async fetchCourses(): Promise<Course[]> {
  await requireSession();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    thumbnail: c.thumbnail,
    category: c.category,
    level: c.level,
    visibility: c.visibility,
    modules: c.modules ?? [],
    createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
  })) as Course[];
},

  async saveCourse(course: Course) {
  if (!(await isAdmin())) throw new Error('Admin only');

  const payload = {
    id: course.id,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    visibility: course.visibility,
    modules: course.modules,
    created_at: course.createdAt,
  };

  const { error } = await supabase.from('courses').upsert(payload);
  if (error) throw error;
},


  // ---------- COHORTS ----------
async fetchCohorts(): Promise<Cohort[]> {
  await requireSession();

  const { data, error } = await supabase
    .from('cohorts')
    .select('*');

  if (error) throw error;

  return (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    year: c.year,
    courseId: c.course_id,
    createdAt: c.created_at
  }));
},

  async addCohort(cohort: { id?: string; name: string; year: number; courseId: string }) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const id = cohort.id ?? `co-${Date.now()}`;
    const { error } = await supabase.from('cohorts').insert({
      id,
      name: cohort.name,
      year: cohort.year,
      course_id: cohort.courseId
    });
    if (error) throw error;
    return id;
  },

  async deleteCohort(cohortId: string) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const { error } = await supabase.from('cohorts').delete().eq('id', cohortId);
    if (error) throw error;
  },

    // ---------- ANNOUNCEMENTS ----------
  async fetchAnnouncements(): Promise<Announcement[]> {
    await requireSession();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(a => ({
      id: a.id,
      title: a.title,
      body: a.body,
      courseId: a.course_id ?? undefined,
      createdAt: a.created_at
    }));
  },

  async addAnnouncement(payload: { title: string; body: string; courseId?: string }) {
    if (!(await isAdmin())) throw new Error('Admin only');

    const session = await requireSession();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: payload.title,
        body: payload.body,
        course_id: payload.courseId ?? null,
        created_by: session.user.id
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      body: data.body,
      courseId: data.course_id ?? undefined,
      createdAt: data.created_at
    } as Announcement;
  },

  async deleteAnnouncement(id: string) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },


  // ---------- ENROLLMENTS (GRANT ACCESS) ----------
  async fetchEnrollments(): Promise<Enrollment[]> {
    await requireSession();

    // Admin can see all; student only sees own (RLS enforces it anyway)
    const { data, error } = await supabase.from('enrollments').select('*');
    if (error) throw error;

    return (data ?? []).map(e => ({
      id: e.id,
      userId: e.user_id,
      courseId: e.course_id,
      cohortId: e.cohort_id,
      enrolledAt: e.enrolled_at,
      expiresAt: e.expires_at
    }));
  },
  // ---------- WORKSHEETS (LIBRARY) ----------
async fetchWorksheets() {
  await requireSession();
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((w: any) => ({
    id: w.id,
    title: w.title,
    body: w.body,
    url: w.url ?? undefined,
    createdAt: w.created_at
  }));
},

async addWorksheet(payload: { title: string; body: string; url?: string }) {
  if (!(await isAdmin())) throw new Error('Admin only');
  const session = await requireSession();

  const id = `ws-${Date.now()}`;

  const { data, error } = await supabase
    .from('worksheets')
    .insert({
      id,
      title: payload.title,
      body: payload.body,
      url: payload.url ?? null,
      created_by: session.user.id
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    body: data.body,
    url: data.url ?? undefined,
    createdAt: data.created_at
  };
},

async deleteWorksheet(id: string) {
  if (!(await isAdmin())) throw new Error('Admin only');
  const { error } = await supabase.from('worksheets').delete().eq('id', id);
  if (error) throw error;
},

// ---------- WORKSHEET REQUESTS ----------
async fetchWorksheetRequests() {
  await requireSession();
  const { data, error } = await supabase
    .from('worksheet_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    createdBy: r.created_by
  }));
},

async addWorksheetRequest(note: string) {
  const session = await requireSession();

  const id = `wr-${Date.now()}`;

  const { data, error } = await supabase
    .from('worksheet_requests')
    .insert({
      id,
      note,
      status: 'open',
      created_by: session.user.id
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    note: data.note,
    status: data.status,
    createdAt: data.created_at,
    createdBy: data.created_by
  };
},

async setWorksheetRequestStatus(id: string, status: 'open' | 'fulfilled') {
  if (!(await isAdmin())) throw new Error('Admin only');
  const { error } = await supabase
    .from('worksheet_requests')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
},

async deleteWorksheetRequest(id: string) {
  if (!(await isAdmin())) throw new Error('Admin only');
  const { error } = await supabase.from('worksheet_requests').delete().eq('id', id);
  if (error) throw error;
},


  async addEnrollment(userId: string, courseId: string, cohortId: string, durationDays: number) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const session = await requireSession();

    const id = `en-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 86400000).toISOString();

    const { error } = await supabase.from('enrollments').insert({
      id,
      user_id: userId,
      course_id: courseId,
      cohort_id: cohortId,
      enrolled_at: now.toISOString(),
      expires_at: expiresAt,
      granted_by: session.user.id
    });

    if (error) throw error;

    return { id, expiresAt };
  },

  async removeEnrollment(enrollmentId: string) {
    if (!(await isAdmin())) throw new Error('Admin only');
    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
    if (error) throw error;
  },

  // PROGRESS
async fetchProgress() {
  await requireSession();
  const { data, error } = await supabase.from("progress").select("*");
  if (error) throw error;
  return data ?? [];
},

async saveProgress(allProgress: any[]) {
  await requireSession();
  // easiest approach: upsert whole list
  const { error } = await supabase.from("progress").upsert(allProgress);
  if (error) throw error;
},

// SUBMISSIONS
async fetchSubmissions() {
  await requireSession();
  const { data, error } = await supabase.from("submissions").select("*");
  if (error) throw error;
  return data ?? [];
},

async saveSubmission(submission: any) {
  await requireSession();
  const { error } = await supabase.from("submissions").insert(submission);
  if (error) throw error;
},

// COHORTS (your store uses saveCohort but db.ts currently has addCohort)
async saveCohort(cohort: any) {
  if (!(await isAdmin())) throw new Error("Admin only");
  const { error } = await supabase.from("cohorts").upsert({
    id: cohort.id,
    name: cohort.name,
    year: cohort.year,
    course_id: cohort.courseId,
    created_at: cohort.createdAt
  });
  if (error) throw error;
},
async deleteUser(userId: string) {
  if (!(await isAdmin())) throw new Error("Admin only");

  // remove related rows first (if you have FK constraints)
  await supabase.from("enrollments").delete().eq("user_id", userId);
  await supabase.from("progress").delete().eq("user_id", userId);
  await supabase.from("submissions").delete().eq("user_id", userId);

  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
},


};
