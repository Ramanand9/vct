
import React, { useState, useRef } from 'react';
import { useLMS } from '../store';
import { UserRole, Course, Lesson, Cohort, User, Attachment, Module } from '../types';

const AdminPanel: React.FC <{
  onPreviewLesson: (courseId: string, lessonId: string) => void;
}> = ({ onPreviewLesson }) => {
  const { 
    users, 
    courses, 
    addCourse,
    updateCourse, 
    enrollUser, 
    revokeEnrollment, 
    addLesson, 
    cohorts, 
    addCohort, 
    deleteCohort, 
    enrollments, 
    addUser, 
    deleteUser,
    isSaving 
  } = useLMS();
  
  const [videoMode, setVideoMode] = useState<'link' | 'file'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [activeView, setActiveView] = useState<'courses' | 'cohorts' | 'users' | 'status'>('courses');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Modal States
  const [showAddLesson, setShowAddLesson] = useState<{courseId: string, moduleId: string} | null>(null);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showAddModule, setShowAddModule] = useState<string | null>(null); // CourseId
  const [showAddCohort, setShowAddCohort] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showManageCohort, setShowManageCohort] = useState<Cohort | null>(null);
  const [showQuickEnroll, setShowQuickEnroll] = useState<User | null>(null);
// use effect hook  on showQuickEnroll - couredata? how to save?  what should happen next?
 
  // Form States
  const [editCourseData, setEditCourseData] = useState({ id: '', title: '', description: '', category: 'Business Strategy', level: 'Beginner' as any });
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ title: '', textNotes: '', duration: '05:00', videoDownloadable: false });
  const [newModuleName, setNewModuleName] = useState('');
  const [attachments, setAttachments] = useState<Partial<Attachment>[]>([]);
  
  const [newCohort, setNewCohort] = useState({ name: '', year: new Date().getFullYear(), courseId: '' });
  const [batchCount, setBatchCount] = useState(1);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.STUDENT });
  const [enrollmentData, setEnrollmentData] = useState({ userId: '', duration: 60, cohortId: '' });

  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleAddAttachment = () => {
    setAttachments([...attachments, { id: 'at-' + Date.now(), name: '', url: '', type: 'pdf', downloadable: false }]);
  };

  const updateAttachment = (index: number, updates: Partial<Attachment>) => {
    const updated = [...attachments];
    updated[index] = { ...updated[index], ...updates };
    setAttachments(updated);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCourseData.id) {
      await updateCourse(editCourseData.id, { 
        title: editCourseData.title, 
        description: editCourseData.description,
        category: editCourseData.category,
        level: editCourseData.level
      });
    } else {
      const newC: Course = {
        id: 'c-' + Date.now(),
        title: editCourseData.title,
        subtitle: 'New Alliance Stream',
        description: editCourseData.description,
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        category: editCourseData.category,
        level: editCourseData.level,
        visibility: 'public',
        modules: [],
        createdAt: new Date().toISOString()
      };
      await addCourse(newC);
    }
    setShowEditCourse(false);
  };

  const handleAddModule = async () => {
    if (!showAddModule || !newModuleName.trim()) return;
    const course = courses.find(c => c.id === showAddModule);
    if (!course) return;

    const newModule: Module = {
      id: 'm-' + Date.now(),
      courseId: showAddModule,
      title: newModuleName,
      order: course.modules.length + 1,
      lessons: []
    };

    await updateCourse(showAddModule, { modules: [...course.modules, newModule] });
    setNewModuleName('');
    setShowAddModule(null);
  };

const handleCreateLesson = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!showAddLesson) return;
  setUploading(true);

  // Pick video URL based on mode
  let videoUrl = '';

  if (videoMode === 'link') {
    const url = videoLink.trim();
    if (!url || !isValidHttpUrl(url)) {
      alert('Please paste a valid YouTube/Vimeo URL (must start with http/https).');
      setUploading(false);
      return;
    }
    videoUrl = url;
  } else {
    // file mode (demo only; blob URLs are not persistent across devices/sessions)
    videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    const file = videoInputRef.current?.files?.[0];
    if (file) videoUrl = URL.createObjectURL(file);
  }

  const lessonId = 'l-' + Date.now();
  const worksheetId = 'ws-' + Date.now();

  const lesson: Lesson = {
    id: lessonId,
    moduleId: showAddLesson.moduleId,
    title: newLesson.title || 'Untitled Phase',
    order: (courses.find(c => c.id === showAddLesson.courseId)
  ?.modules.find(m => m.id === showAddLesson.moduleId)
  ?.lessons.length ?? 0) + 1, // Logic handled in store's addLesson
    videoUrl,
    duration: newLesson.duration || '05:00',
    textNotes: newLesson.textNotes || '',
    attachments: attachments as Attachment[],
    videoDownloadable: newLesson.videoDownloadable || false,
    worksheet: {
      id: worksheetId,
      lessonId,
      title: 'Phase Deployment Plan',
      instructions: 'Document your deployment strategy for this module.'
    }
  };

  await addLesson(showAddLesson.courseId, showAddLesson.moduleId, lesson);

  setUploading(false);
  setShowAddLesson(null);
  setNewLesson({ title: '', textNotes: '', duration: '05:00', videoDownloadable: false });
  setAttachments([]);

  // Reset video inputs
  setVideoLink('');
  setVideoMode('link');
  if (videoInputRef.current) videoInputRef.current.value = '';
};


  const handleEnrollUserToCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = showQuickEnroll ? showQuickEnroll.id : enrollmentData.userId;
    const targetCohortId = showManageCohort ? showManageCohort.id : enrollmentData.cohortId;

    if (!targetUserId || !targetCohortId) return;

    const cohort = cohorts.find(c => c.id === targetCohortId);
    if (!cohort) return;

    await enrollUser(targetUserId, cohort.courseId, targetCohortId, enrollmentData.duration);
    setEnrollmentData({ userId: '', duration: 60, cohortId: '' });
    setShowQuickEnroll(null);
  };

  // Fix: Added handleAddCohort to handle new cohort creation
  const handleAddCohort = async (e: React.FormEvent) => {
    if (!newCohort.name || !newCohort.courseId) return;
    await addCohort(newCohort);
    setNewCohort({ name: '', year: new Date().getFullYear(), courseId: '' });
    setShowAddCohort(false);
  };

  // Fix: Added handleAddUser to handle new partner registration
  const handleAddUser = async (e: React.FormEvent) => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    await addUser({
      ...newUser,
      status: 'active',
      enrolledCourses: []
    });
    setNewUser({ name: '', email: '', password: '', role: UserRole.STUDENT });
    setShowAddUser(false);
  };

  const isValidHttpUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};


  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">VRT Management Command</p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Admin Control Center</h1>
          <div className="flex bg-white shadow-xl shadow-slate-200/50 border border-slate-100 p-2 rounded-3xl mt-6">
            {['courses', 'cohorts', 'users', 'status'].map((view) => (
              <button 
                key={view} 
                onClick={() => { setActiveView(view as any); setEditingCourse(null); }} 
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeView === view && !editingCourse ? 'bg-nitrocrimson-600 text-white shadow-lg shadow-nitrocrimson-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        
        {isSaving && (
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-nitrocrimson-50 animate-pulse">
            <i className="fas fa-circle-notch fa-spin text-nitrocrimson-600"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Syncing to Cloud...</span>
          </div>
        )}
      </header>

      {/* --- COURSES / CURRICULUM ARCHITECT VIEW --- */}
      {activeView === 'courses' && (
        <div className="animate-fadeIn">
          {!editingCourse ? (
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Curriculum Hub</h2>
                  <p className="text-slate-400 font-medium text-sm">Manage global alliance courses and growth phases</p>
                </div>
                <button onClick={() => { setEditCourseData({ id: '', title: '', description: '', category: 'Business Strategy', level: 'Beginner' }); setShowEditCourse(true); }} className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-nitrocrimson-100 hover:bg-nitrocrimson-700 transition-all flex items-center gap-2">
                  <i className="fas fa-plus"></i> New Alliance
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.map(course => (
                  <div key={course.id} className="group border-2 border-slate-50 rounded-[2.5rem] p-8 hover:border-nitrocrimson-200 hover:shadow-2xl hover:shadow-slate-100 transition-all flex flex-col justify-between bg-slate-50/30">
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-5">
                          <div className="relative">
                            <img src={course.thumbnail} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-lg" alt="" />
                            <div className="absolute -top-2 -right-2 bg-nitrocrimson-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">Alliance</div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-black text-slate-900 text-xl truncate pr-2 tracking-tight">{course.title}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{course.modules.length} Sections • {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} Phases</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditCourseData({ id: course.id, title: course.title, description: course.description, category: course.category, level: course.level }); setShowEditCourse(true); }}
                            className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => setEditingCourse(course)} className="px-6 h-12 bg-nitrocrimson-50 text-nitrocrimson-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-nitrocrimson-600 hover:text-white transition-all shadow-sm border border-nitrocrimson-100 flex items-center gap-2">
                            Architect <i className="fas fa-sitemap"></i>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{course.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl animate-slideUp">
              <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-8">
                <div className="flex items-center gap-6">
                  <button onClick={() => setEditingCourse(null)} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <div>
                    <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-widest mb-1">Curriculum Architect</p>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{editingCourse.title}</h2>
                  </div>
                </div>
                <button onClick={() => setShowAddModule(editingCourse.id)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 shadow-xl transition-all flex items-center gap-3">
                  <i className="fas fa-folder-plus"></i> Add New Section
                </button>
              </div>

              <div className="space-y-12">
                {editingCourse.modules.length === 0 ? (
                  <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/20">
                    <i className="fas fa-boxes-stacked text-5xl text-slate-100 mb-6"></i>
                    <h3 className="text-xl font-bold text-slate-400">No Sections Defined</h3>
                    <p className="text-slate-300 text-sm mt-2">Break your alliance into modules to begin adding growth phases.</p>
                  </div>
                ) : (
                  editingCourse.modules.map(m => (
                    <div key={m.id} className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8">
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">{m.order}</div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{m.title}</h3>
                         </div>
                         <button onClick={() => setShowAddLesson({ courseId: editingCourse.id, moduleId: m.id })} className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-nitrocrimson-600 hover:text-nitrocrimson-600 transition-all flex items-center gap-2 shadow-sm">
                            <i className="fas fa-plus-circle"></i> Add Growth Phase
                         </button>
                      </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {m.lessons.map(l => (
    <button
      key={l.id}
      type="button"
      onClick={() => onPreviewLesson(editingCourse.id, l.id)}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all text-left w-full cursor-pointer"
    >
      <div className="flex items-center gap-4 truncate">
        <div className="w-10 h-10 bg-nitrocrimson-50 text-nitrocrimson-600 rounded-xl flex items-center justify-center text-xs">
          <i className="fas fa-play"></i>
        </div>
        <div className="truncate">
          <p className="text-xs font-black text-slate-900 truncate">{l.title}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            {l.duration} Stream
          </p>
        </div>
      </div>

      {/* keep this as a non-clicking icon for now */}
      <span className="text-slate-200 group-hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100">
        <i className="fas fa-ellipsis-v"></i>
      </span>
    </button>
  ))}
</div>

                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* --- OTHER VIEWS --- */}
      {activeView === 'cohorts' && (
         <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Cohort Streams</h2>
                <p className="text-slate-400 font-medium text-sm">Organize partners into specific learning tracks</p>
              </div>
              <button onClick={() => setShowAddCohort(true)} className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-nitrocrimson-100 hover:bg-nitrocrimson-700 transition-all flex items-center gap-2">
                <i className="fas fa-layer-group"></i> Create Cohort Stream
              </button>
            </div>
            
            {cohorts.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem]">
                 <i className="fas fa-users-slash text-5xl text-slate-100 mb-6"></i>
                 <h3 className="text-xl font-bold text-slate-400 tracking-tight">No cohort streams initialized yet.</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {cohorts.map(c => (
                  <div key={c.id} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:bg-white transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-nitrocrimson-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-nitrocrimson-100">Stream {c.year}</div>
                        <button onClick={() => { if(confirm("Are you sure?")) deleteCohort(c.id); }} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                      <h3 className="font-black text-slate-900 text-2xl mb-4 tracking-tight leading-tight">{c.name}</h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-8 bg-white p-3 rounded-xl border border-slate-50">
                        <i className="fas fa-link text-nitrocrimson-500"></i>
                        <span className="truncate">{courses.find(co => co.id === c.courseId)?.title || "Unlinked"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Capacity Status</span>
                        <span className="text-nitrocrimson-600">{enrollments.filter(e => e.cohortId === c.id).length} Partners</span>
                      </div>
                      <button onClick={() => setShowManageCohort(c)} className="w-full bg-white border border-slate-100 py-4 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                        Manage Partners <i className="fas fa-chevron-right text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
         </section>
      )}

      {activeView === 'users' && (
        <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Partner Directory</h2>
              <p className="text-slate-400 font-medium text-sm">Full list of authenticated members</p>
            </div>
            <button onClick={() => setShowAddUser(true)} className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-nitrocrimson-100 hover:bg-nitrocrimson-700 transition-all flex items-center gap-2">
              <i className="fas fa-user-plus"></i> Create Partner Account
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Partner identity</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Access Level</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Alliances</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 text-right">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-8 px-4">
                      <div className="flex items-center space-x-5">
                        <img src={u.avatar} className="w-12 h-12 rounded-2xl shadow-md border-2 border-white" alt="" />
                        <div>
                          <p className="font-black text-slate-900 text-base">{u.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-4">
                      <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl tracking-widest ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-8 px-4">
                       <div className="flex items-center gap-2">
                          <i className="fas fa-shield-alt text-nitrocrimson-500"></i>
                          <span className="text-xs font-black text-slate-800">
  {new Set(enrollments.filter(e => e.userId === u.id).map(e => e.courseId)).size}
</span>

                       </div>
                    </td>
                    <td className="py-8 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.role === UserRole.STUDENT && (
                          <button 
                            onClick={() => { setEnrollmentData({userId: u.id, duration:60,cohortId:cohorts[0]?.id??''}); setShowQuickEnroll(u)}}
                            className="w-10 h-10 bg-nitrocrimson-50 text-nitrocrimson-600 rounded-xl flex items-center justify-center hover:bg-nitrocrimson-600 hover:text-white transition-all shadow-sm border border-nitrocrimson-100"
                            title="Quick Alliance Assignment"
                          >
                            <i className="fas fa-plus-circle"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => { if(confirm(`Confirm deletion?`)) deleteUser(u.id); }} 
                          className="w-10 h-10 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all rounded-xl"
                        >
                          <i className="fas fa-user-minus"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* --- INFRASTRUCTURE STATUS --- */}
      {activeView === 'status' && (
        <section className="animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-server text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Primary Node</h3>
              <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-4">Operational</p>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-slate-900">12ms</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-slate-900">99.98%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="w-16 h-16 bg-nitrocrimson-50 text-nitrocrimson-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-database text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Storage Persistence</h3>
              <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-widest mb-4">Sync Active</p>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Database Size</span>
                  <span className="text-slate-900">1.2 GB / 50 GB</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full">
                  <div className="bg-nitrocrimson-600 h-full w-[2%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-shield-halved text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Security Shield</h3>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">Encrypted</p>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">SSL Certificate</span>
                  <span className="text-green-600">Valid</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Active Sessions</span>
                  <span className="text-slate-900">{users.length} authenticated</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- MODALS --- */}

      {/* NEW/EDIT ALLIANCE MODAL */}
      {showEditCourse && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl animate-scaleIn border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{editCourseData.id ? 'Configure Alliance' : 'Create New Alliance'}</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Foundational Stream Setup</p>
              </div>
              <button onClick={() => setShowEditCourse(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Alliance Title</label>
                  <input required type="text" value={editCourseData.title} onChange={e => setEditCourseData({...editCourseData, title: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold text-slate-800" placeholder="e.g. Master Execution Alliance" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Brief Description</label>
                  <textarea required value={editCourseData.description} onChange={e => setEditCourseData({...editCourseData, description: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-medium h-32" placeholder="Describe the growth outcomes..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</label>
                    <input type="text" value={editCourseData.category} onChange={e => setEditCourseData({...editCourseData, category: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mastery Level</label>
                    <select value={editCourseData.level} onChange={e => setEditCourseData({...editCourseData, level: e.target.value as any})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[1.8rem] font-black text-lg shadow-2xl hover:bg-nitrocrimson-600 transition-all">
                {editCourseData.id ? 'Update Alliance Configuration' : 'Initialize Alliance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODULE MODAL */}
      {showAddModule && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl animate-scaleIn border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">New Curriculum Section</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Defining a growth module</p>
              </div>
              <button onClick={() => setShowAddModule(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Section Title</label>
                <input 
                  required 
                  type="text" 
                  value={newModuleName} 
                  onChange={e => setNewModuleName(e.target.value)} 
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold" 
                  placeholder="e.g. Phase 1: Strategic Foundations" 
                />
              </div>
              <button onClick={handleAddModule} className="w-full py-6 bg-slate-900 text-white rounded-[1.8rem] font-black text-lg shadow-2xl hover:bg-nitrocrimson-600 transition-all">
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PHASE MODAL */}
      {showAddLesson && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-scaleIn border border-slate-100 my-10 mx-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">New Growth Phase</h2>
                <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-widest mt-1">Strategic Briefing Configuration</p>
              </div>
              <button onClick={() => setShowAddLesson(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCreateLesson} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Phase Title</label>
                  <input required type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold" placeholder="e.g. Scaling Foundations" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Est. Duration</label>
                   <input required type="text" value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold" placeholder="e.g. 12:45" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategic Intelligence Briefing (Notes)</label>
                <textarea value={newLesson.textNotes} onChange={e => setNewLesson({...newLesson, textNotes: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-600 outline-none h-32 font-medium" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Assets & Documentation</label>
                  <button type="button" onClick={handleAddAttachment} className="text-[10px] font-black uppercase text-nitrocrimson-600 hover:text-nitrocrimson-700 bg-nitrocrimson-50 px-4 py-2 rounded-xl transition-all">
                    <i className="fas fa-plus-circle mr-1"></i> Add Growth Resource
                  </button>
                </div>
                <div className="space-y-4">
                  {attachments.map((at, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100 flex flex-col gap-5 shadow-sm">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Asset Name</label>
                          <input placeholder="File Name (e.g. Strategic Workbook)" className="w-full bg-white px-5 py-3 rounded-xl text-xs font-bold border-0 shadow-inner" value={at.name} onChange={e => updateAttachment(idx, { name: e.target.value })} />
                        </div>
                        <div className="w-32">
                          <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Type</label>
                          <select className="w-full bg-white px-4 py-3 rounded-xl text-xs font-bold border-0 appearance-none shadow-inner" value={at.type} onChange={e => updateAttachment(idx, { type: e.target.value as any })}>
                            <option value="pdf">PDF Doc</option>
                            <option value="image">Image (JPG)</option>
                            <option value="doc">MS Word</option>
                            <option value="link">External Link</option>
                          </select>
                        </div>
                        <button type="button" onClick={() => removeAttachment(idx)} className="mt-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times-circle text-lg"></i></button>
                      </div>
                      <div className="flex items-center justify-between gap-6 pt-4 border-t border-slate-200/50">
                        <div className="flex-1">
                           <input placeholder="Resource URL or File Path Placeholder" className="w-full bg-white px-5 py-3 rounded-xl text-xs font-medium border-0 shadow-inner" value={at.url} onChange={e => updateAttachment(idx, { url: e.target.value })} />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-3 cursor-pointer group bg-white px-4 py-2 rounded-xl border border-slate-100 hover:border-nitrocrimson-200 transition-all">
                            <input 
                              type="checkbox" 
                              checked={at.downloadable} 
                              onChange={e => updateAttachment(idx, { downloadable: e.target.checked })} 
                              className="w-5 h-5 rounded text-nitrocrimson-600 border-slate-200 focus:ring-nitrocrimson-500 transition-all" 
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight">Allow Download</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Student Permission</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Master Asset (Video Stream)</label>
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] p-10 text-center cursor-pointer hover:border-nitrocrimson-400 hover:bg-nitrocrimson-50/20 transition-all group shadow-inner">
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" id="video-upload-admin" />
                  <label htmlFor="video-upload-admin" className="cursor-pointer">
                    <i className="fas fa-cloud-upload-alt text-4xl text-slate-200 group-hover:text-nitrocrimson-600 mb-3 block transition-colors"></i>
                    <p className="font-black text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest text-[10px]">Deploy Secured Briefing</p>
                  </label>
                </div>
              </div> */}

              <div className="space-y-4">
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
    Strategic Master Asset (Video)
  </label>

  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => setVideoMode('link')}
      className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
        videoMode === 'link'
          ? 'bg-nitrocrimson-600 text-white border-nitrocrimson-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-nitrocrimson-300'
      }`}
    >
      YouTube/Vimeo Link
    </button>

    <button
      type="button"
      onClick={() => setVideoMode('file')}
      className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
        videoMode === 'file'
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
      }`}
    >
      Direct MP4 (File)
    </button>
  </div>

  {videoMode === 'link' ? (
    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
      <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">
        Video URL (YouTube/Vimeo)
      </label>
      <input
        value={videoLink}
        onChange={(e) => setVideoLink(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=...  or  https://vimeo.com/..."
        className="w-full bg-white px-5 py-4 rounded-xl text-xs font-bold border-0 shadow-inner"
      />
      <p className="text-[10px] text-slate-400 font-bold mt-3">
        Tip: This will open externally inside CoursePlayer.
      </p>
    </div>
  ) : (
    <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] p-10 text-center cursor-pointer hover:border-nitrocrimson-400 hover:bg-nitrocrimson-50/20 transition-all group shadow-inner">
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" id="video-upload-admin" />
      <label htmlFor="video-upload-admin" className="cursor-pointer">
        <i className="fas fa-cloud-upload-alt text-4xl text-slate-200 group-hover:text-nitrocrimson-600 mb-3 block transition-colors"></i>
        <p className="font-black text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest text-[10px]">
          Upload MP4 (demo)
        </p>
      </label>
    </div>
  )}
</div>


              <button type="submit" disabled={uploading} className="w-full py-6 bg-slate-900 text-white rounded-[1.8rem] font-black text-lg shadow-2xl hover:bg-nitrocrimson-600 transition-all transform active:scale-95 disabled:opacity-50">
                {uploading ? <i className="fas fa-circle-notch fa-spin mr-3"></i> : null}
                {uploading ? 'Launching Infrastructure...' : 'Deploy Growth Phase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OTHER MODALS: Cohort, User, etc. remain here but omitted for brevity if no changes needed */}
      {showAddCohort && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl animate-scaleIn border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">New Cohort Stream</h2>
              <button onClick={() => setShowAddCohort(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddCohort(e); }} className="space-y-6">
               <input required placeholder="Cohort Name" className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600" value={newCohort.name} onChange={e => setNewCohort({...newCohort, name: e.target.value})} />
               <select required value={newCohort.courseId} onChange={e => setNewCohort({...newCohort, courseId: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600">
                  <option value="">Link to Alliance...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
               <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all">Initialize Stream</button>
            </form>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl animate-scaleIn border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">New Partner Account</h2>
              <button onClick={() => setShowAddUser(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddUser(e); }} className="space-y-6">
               <input required placeholder="Name" className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
               <input required type="email" placeholder="Email" className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
               <input required type="password" placeholder="Password" className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
               <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all">Provision Account</button>
            </form>
          </div>
        </div>
      )}

      {showManageCohort && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Managing: {showManageCohort.name}</h2>
              <button onClick={() => setShowManageCohort(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Enroll Partner</h3>
                    <form onSubmit={handleEnrollUserToCohort} className="space-y-4">
                      <select required value={enrollmentData.userId} onChange={e => setEnrollmentData({...enrollmentData, userId: e.target.value})} className="w-full bg-white p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-nitrocrimson-600 font-bold">
                        <option value="">Select Partner...</option>
                        {users.filter(u => u.role === UserRole.STUDENT).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <button type="submit" className="w-full py-4 bg-nitrocrimson-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-700 transition-all">Confirm Enrollment</button>
                    </form>
                  </div>
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Enrolled Members</h3>
                  <div className="space-y-4">
                    {enrollments.filter(e => e.cohortId === showManageCohort.id).map(en => {
                      const user = users.find(u => u.id === en.userId);
                      return (
                        <div key={en.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group">
                          <span className="text-sm font-bold text-slate-700">{user?.name}</span>
                          <button onClick={() => revokeEnrollment(en.id)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><i className="fas fa-user-xmark"></i></button>
                        </div>
                      )
                    })}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showQuickEnroll && (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-scaleIn border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Grant Course Access</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
              Assign an alliance stream to {showQuickEnroll.name}
            </p>
          </div>
          <button
            onClick={() => setShowQuickEnroll(null)}
            className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* If no cohorts exist, admin can't enroll via cohort */}
        {cohorts.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <p className="text-slate-700 font-bold">
              No cohorts exist yet. Create a cohort first in the <span className="font-black">Cohorts</span> tab.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleEnrollUserToCohort} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Select Cohort Stream
                </label>
                <select
                  required
                  value={enrollmentData.cohortId}
                  onChange={e => setEnrollmentData({ ...enrollmentData, cohortId: e.target.value })}
                  className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600"
                >
                  <option value="">Choose cohort…</option>
                  {cohorts.map(c => {
                    const courseTitle = courses.find(co => co.id === c.courseId)?.title || 'Unlinked Course';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.year}) — {courseTitle}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Access Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={enrollmentData.duration}
                  onChange={e => setEnrollmentData({ ...enrollmentData, duration: Number(e.target.value) })}
                  className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-nitrocrimson-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all disabled:opacity-50"
              >
                {isSaving ? "Granting..." : "Grant Access"}
              </button>
            </form>

            {/* Show existing enrollments for this student */}
            <div className="mt-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Current Access
              </h3>

              <div className="space-y-3">
                {enrollments.filter(e => e.userId === showQuickEnroll.id).length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-500 font-bold">
                    No course access yet.
                  </div>
                ) : (
                  enrollments
                    .filter(e => e.userId === showQuickEnroll.id)
                    .map(en => {
                      const course = courses.find(c => c.id === en.courseId);
                      return (
                        <div key={en.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="font-black text-slate-900">{course?.title ?? en.courseId}</div>
                            <div className="text-xs text-slate-400 font-bold mt-1">
                              Cohort: {en.cohortId} • Expires: {new Date(en.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => revokeEnrollment(en.id)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-nitrocrimson-600 hover:text-nitrocrimson-600"
                          >
                            Revoke
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #EA0027; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
