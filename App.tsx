
import React, { useState } from 'react';
import { LMSProvider, useLMS } from './store';
import { Course, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import CoursePlayer from './screens/CoursePlayer';
import AdminPanel from './screens/AdminPanel';
import Community from './screens/Community';
import AIAdvisor from './screens/AIAdvisor';
import Logo from './components/Logo';
import { generateCoursePDF } from './components/CertificateGenerator';

const AuthScreen: React.FC = () => {
  const { login, signup } = useLMS();
  const [email, setEmail] = useState('admin@entrelms.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");


  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsAuthenticating(true);
  //   const success = await login(email, password);
  //   if (!success) {
  //     setError('Invalid credentials or access blocked.');
  //     setIsAuthenticating(false);
  //   }
  // };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsAuthenticating(true);

  try {
    const ok =
      mode === "login"
        ? await login(email, password)
        : await signup(name, email, password);

    if (!ok) setError(mode === "login" ? "Invalid credentials or access blocked." : "Signup failed.");
  } catch (err: any) {
    console.error(`${mode} crashed:`, err);
    setError(err?.message ?? `${mode} failed.`);
  } finally {
    setIsAuthenticating(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg animate-scaleIn">
        <div className="text-center mb-12">
          <Logo size="xl" />
        </div>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          {isAuthenticating && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
                <i className="fas fa-circle-notch fa-spin text-4xl text-nitrocrimson-600 mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Verifying Identity...</p>
             </div>
          )}
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Partner Portal</h2>
            <p className="text-slate-400 font-medium">Please sign in with your credentials</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
          {mode === "signup" && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
              placeholder="Your name"
            />
          </div>
          )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                placeholder="name@vrtmanagement.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Security Key (Password)</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center animate-shake">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}
            
            <button type="submit" disabled={isAuthenticating} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-nitrocrimson-600 shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50">
              {mode === "login" ? "Enter Alliance" : "Create Account"}
            </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
              setError("");
              setMode(mode === "login" ? "signup" : "login");
            }}
            className="text-xs font-bold text-slate-500 hover:text-nitrocrimson-600"
          >
              {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
            </button>
          </div>

          </form>
          
          <div className="mt-12 pt-10 border-t border-slate-50">
            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Quick Access Mode</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => { setEmail('admin@entrelms.com'); setPassword('password123'); }} className="text-[10px] font-black uppercase bg-slate-50 py-3 rounded-xl border border-slate-100 hover:border-nitrocrimson-600 transition-all text-slate-400 hover:text-nitrocrimson-600">Admin</button>
              <button onClick={() => { setEmail('john@student.com'); setPassword('password123'); }} className="text-[10px] font-black uppercase bg-slate-50 py-3 rounded-xl border border-slate-100 hover:border-nitrocrimson-600 transition-all text-slate-400 hover:text-nitrocrimson-600">Student</button>
              <button onClick={() => { setEmail('mark@coach.com'); setPassword('password123'); }} className="text-[10px] font-black uppercase bg-slate-50 py-3 rounded-xl border border-slate-100 hover:border-nitrocrimson-600 transition-all text-slate-400 hover:text-nitrocrimson-600">Coach</button>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-300 text-xs font-medium">
          &copy; {new Date().getFullYear()} VRT Management Group. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 animate-fadeIn">
    <Logo size="lg" showTagline={false} className="animate-pulse mb-8" />
    <div className="flex items-center gap-3">
       <div className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce"></div>
       <div className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
       <div className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
    </div>
    <p className="mt-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Initializing Cloud Infrastructure...</p>
  </div>
);

const AnnouncementsPage: React.FC = () => {
  const { announcements, addAnnouncement, deleteAnnouncement, currentUser, courses, isSaving } = useLMS();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState<string>("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAnnouncement(title.trim(), body.trim(), courseId || undefined);
    setTitle("");
    setBody("");
    setCourseId("");
    setShowCreate(false);
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth Alerts</h2>
          <p className="text-slate-400 font-medium mt-2">Stay updated with the latest from VRT Management.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-700 transition-all shadow-xl"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Update
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
            <i className="fas fa-bullhorn text-4xl"></i>
          </div>
          <h3 className="text-xl font-black text-slate-900">No announcements yet</h3>
          <p className="text-slate-400 mt-2">Admin can post updates here for everyone to see.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {announcements.map(a => {
            const courseTitle = a.courseId ? (courses.find(c => c.id === a.courseId)?.title ?? "Course") : null;
            return (
              <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-xl font-black text-slate-900">{a.title}</h4>
                      {courseTitle && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 px-3 py-2 rounded-full border border-slate-100">
                          {courseTitle}
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium mt-4 leading-relaxed whitespace-pre-line">
                      {a.body}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this announcement?")) deleteAnnouncement(a.id);
                      }}
                      className="w-12 h-12 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all rounded-2xl flex items-center justify-center flex-shrink-0"
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[80] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-scaleIn border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Publish Update</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                  Visible to all members
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={onCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Optional: Link to Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold text-slate-800"
                >
                  <option value="">No course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold text-slate-800"
                  placeholder="e.g. New cohort starts Monday"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Message
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold text-slate-800"
                  placeholder="Write the update…"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-6 bg-nitrocrimson-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-nitrocrimson-700 transition-all disabled:opacity-50"
              >
                {isSaving ? "Publishing..." : "Publish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const WorksheetsPage: React.FC = () => {
  const {
    worksheets,
    worksheetRequests,
    addWorksheet,
    deleteWorksheet,
    addWorksheetRequest,
    setWorksheetRequestStatus,
    deleteWorksheetRequest,
    currentUser,
    isSaving
  } = useLMS();

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [showAdd, setShowAdd] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="max-w-6xl mx-auto pt-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Worksheets
          </h2>
          <p className="text-slate-400 font-medium mt-2">
            Shared templates, assignments, and public worksheet requests.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowRequest(true)}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl"
          >
            Request Worksheet
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-700 shadow-xl"
            >
              Add Worksheet
            </button>
          )}
        </div>
      </div>

      {/* Worksheet Library */}
      {worksheets.length === 0 ? (
        <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
          <h3 className="text-xl font-black text-slate-900">
            No worksheets yet
          </h3>
          <p className="text-slate-400 mt-2">
            Admin can add worksheets here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worksheets.map(w => (
            <div
              key={w.id}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
            >
              <h4 className="text-xl font-black text-slate-900">
                {w.title}
              </h4>

              <p className="text-slate-600 font-medium mt-3 whitespace-pre-line">
                {w.body}
              </p>

              {w.url && (
                <a
                  href={w.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-nitrocrimson-600"
                >
                  Open Worksheet
                </a>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm("Delete this worksheet?")) {
                      deleteWorksheet(w.id);
                    }
                  }}
                  className="mt-4 text-xs font-black uppercase text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Public Requests */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-6">
          Worksheet Requests (Public)
        </h3>

        {worksheetRequests.length === 0 ? (
          <p className="text-slate-400">No requests yet.</p>
        ) : (
          <div className="space-y-4">
            {worksheetRequests.map(r => (
              <div
                key={r.id}
                className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 flex justify-between gap-4"
              >
                <div>
                  <p className="text-slate-700 font-medium whitespace-pre-line">
                    {r.note}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-3">
                    {new Date(r.createdAt).toLocaleString()} • {r.status}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setWorksheetRequestStatus(
                          r.id,
                          r.status === "open" ? "fulfilled" : "open"
                        )
                      }
                      className="text-xs font-black uppercase text-green-600"
                    >
                      Toggle
                    </button>

                    <button
                      onClick={() => deleteWorksheetRequest(r.id)}
                      className="text-xs font-black uppercase text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals omitted for brevity — you already saw them earlier */}
            {/* ===== MODALS ===== */}

      {/* Request Worksheet Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Request Worksheet
                </h3>
                <p className="text-slate-400 font-medium mt-1">
                  This note is public — everyone can see it.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRequest(false)}
                className="text-slate-400 hover:text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your request here..."
                className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRequest(false);
                  setNote("");
                }}
                className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-800 font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  if (!note.trim()) return alert("Please enter a request note.");
                  try {
                    await addWorksheetRequest(note.trim());
                    setNote("");
                    setShowRequest(false);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to request worksheet. Check console for details.");
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest disabled:opacity-60"
              >
                {isSaving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Worksheet Modal (Admin only) */}
      {showAdd && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Add Worksheet
                </h3>
                <p className="text-slate-400 font-medium mt-1">
                  Add a worksheet for students/coaches.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-slate-400 hover:text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Body / instructions"
                className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              />

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Optional URL"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setTitle("");
                  setBody("");
                  setUrl("");
                }}
                className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-800 font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  if (!title.trim() || !body.trim()) {
                    return alert("Title and body are required.");
                  }
                  try {
                    await addWorksheet(title.trim(), body.trim(), url.trim() || undefined);
                    setTitle("");
                    setBody("");
                    setUrl("");
                    setShowAdd(false);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to add worksheet. Check console for details.");
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-nitrocrimson-600 text-white font-black text-xs uppercase tracking-widest disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Add Worksheet"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


const MainApp: React.FC = () => {
  const { currentUser, courses, isCourseCompleted, isLoading } = useLMS();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (!currentUser) return <AuthScreen />;

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const completedCourses = courses.filter(c => isCourseCompleted(c.id));
  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <Layout activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSelectedCourseId(null);setSelectedLessonId(null); }}>
      {selectedCourse ? (
        <CoursePlayer 
          courseId={selectedCourse.id}
          initialLessonId={selectedLessonId} 
          onBack={() => {setSelectedCourseId(null);setSelectedLessonId(null);} }
        />
      ) : (
        <>
          {activeTab === 'dashboard' && <Dashboard onSelectCourse={(c) => setSelectedCourseId(c.id)} />}
          {activeTab === 'admin' && isAdmin && (
  <AdminPanel
    onPreviewLesson={(courseId, lessonId) => {
      setSelectedCourseId(courseId);
      setSelectedLessonId(lessonId);
    }}
  />
)}

          {activeTab === 'ai-advisor' && !isAdmin && <AIAdvisor />}
          {activeTab === 'community' && <Community />}
          {activeTab === 'worksheets' && <WorksheetsPage />}

          {activeTab === 'announcements' && (
            <AnnouncementsPage />
          )}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto pt-10 space-y-8 animate-fadeIn">
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-nitrocrimson-600"></div>
                <img src={currentUser.avatar} className="w-40 h-40 rounded-[2rem] mx-auto mb-8 border-4 border-white shadow-xl object-cover" alt="" />
                <h2 className="text-4xl font-black text-slate-900">{currentUser.name}</h2>
                <p className="text-slate-400 font-bold mt-2">{currentUser.email}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 border-t border-slate-50 pt-10">
                  <div className="text-center bg-slate-50 p-6 rounded-[2rem]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Status</p>
                    <span className="text-green-600 font-black flex items-center justify-center">
                      <i className="fas fa-check-circle mr-2"></i> {currentUser.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center bg-slate-50 p-6 rounded-[2rem]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Level</p>
                    <span className="text-nitrocrimson-600 font-black uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* CERTIFICATES / CREDENTIALS SECTION */}
              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center">
                    <i className="fas fa-award text-nitrocrimson-600 mr-4"></i>
                    Verified Credentials
                  </h3>
                  <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                    {completedCourses.length} Achieved
                  </span>
                </div>

                {completedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedCourses.map(course => (
                      <div key={course.id} className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-white hover:shadow-xl transition-all group">
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-nitrocrimson-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-nitrocrimson-200">
                              <i className="fas fa-certificate text-xl"></i>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-nitrocrimson-600 uppercase tracking-widest">EGA Certification</p>
                              <h4 className="font-black text-slate-900 tracking-tight leading-tight">{course.title}</h4>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => generateCoursePDF(currentUser, course)}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-nitrocrimson-600 transition-all shadow-lg active:scale-95"
                        >
                          <i className="fas fa-download"></i>
                          Download Certificate (PDF)
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                      <i className="fas fa-scroll text-3xl"></i>
                    </div>
                    <h4 className="text-xl font-black text-slate-900">No Credentials Yet</h4>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                      Complete all lessons and deployment plans in an alliance to unlock your executive certifications.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <LMSProvider>
      <MainApp />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </LMSProvider>
  );
};

export default App;
