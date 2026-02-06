
import React, { useState } from 'react';
import { useLMS } from '../store';
import { Course, Lesson, Cohort, UserRole } from '../types';

interface DashboardProps {
  onSelectCourse: (course: Course) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectCourse }) => {
  const { currentUser, courses, progress, isAccessExpired, getDaysRemaining, isLessonCompleted, cohorts, enrollUser, enrollments } = useLMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showActivationPortal, setShowActivationPortal] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState('');
const myCourseIds = new Set(
  enrollments
    .filter(e => e.userId === currentUser?.id)
    .map(e => e.courseId)
);

const enrolledCourses = courses.filter(c => myCourseIds.has(c.id));

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const filteredCourses = enrolledCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProgressValue = (courseId: string) => {
    const p = progress.find(pr => pr.userId === currentUser?.id && pr.courseId === courseId);
    if (!p) return 0;
    const course = courses.find(c => c.id === courseId);
    const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
    if (totalLessons === 0) return 0;
    return Math.round((p.completedLessons.length / totalLessons) * 100);
  };

  const getResumeLesson = (course: Course): Lesson | null => {
    for (const m of course.modules) {
      for (const l of m.lessons) {
        if (!isLessonCompleted(course.id, l.id)) return l;
      }
    }
    if (course.modules.length === 0) return null;
    const lastModule = course.modules[course.modules.length - 1];
    if (lastModule.lessons.length === 0) return null;
    return lastModule.lessons[lastModule.lessons.length - 1];
  };

  const handleSelfEnroll = (courseId: string) => {
    if (!currentUser || !selectedCohortId) return;
    enrollUser(currentUser.id, courseId, selectedCohortId, 60); // Default 60 days
    setShowActivationPortal(false);
    setSelectedCohortId('');
  };

  // If no courses and not searching, show the "Activation Portal"
  if (enrolledCourses.length === 0 && !searchQuery) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fadeIn p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-[4rem] p-12 md:p-20 text-center shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <i className="fas fa-shield-alt text-[15rem] text-slate-900"></i>
            </div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-nitrocrimson-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-nitrocrimson-600 shadow-xl shadow-nitrocrimson-100">
                <i className="fas fa-key text-4xl"></i>
              </div>
              
              <p className="text-[12px] font-black uppercase text-nitrocrimson-600 tracking-[0.4em] mb-4">Identity Verified</p>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-8 leading-none">Alliance Activation</h2>
              
              <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12 max-w-xl mx-auto">
                Your account is authenticated, but no active growth alliances are assigned. Select a strategic track below to initialize your deployment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {courses.map(course => {
                  const availableCohorts = cohorts.filter(c => c.courseId === course.id);
                  return (
                    <div key={course.id} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 hover:border-nitrocrimson-300 transition-all group">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={course.thumbnail} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                        <div>
                          <h4 className="font-black text-slate-900 tracking-tight">{course.title}</h4>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{course.category}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Cohort Stream</label>
                        <select 
                          className="w-full bg-white border-0 rounded-xl px-4 py-4 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-nitrocrimson-600 appearance-none"
                          onChange={(e) => setSelectedCohortId(e.target.value)}
                          value={selectedCohortId}
                        >
                          <option value="">Choose your batch...</option>
                          {availableCohorts.map(coh => (
                            <option key={coh.id} value={coh.id}>{coh.name} ({coh.year})</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleSelfEnroll(course.id)}
                          disabled={!selectedCohortId}
                          className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all disabled:opacity-20 shadow-xl active:scale-95"
                        >
                          Initialize Alliance Access
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-center gap-8">
                 <div className="flex items-center gap-3 text-slate-400">
                    <i className="fas fa-headset text-nitrocrimson-600"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Support Active</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <i className="fas fa-lock text-nitrocrimson-600"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encryption</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {currentUser?.name}!</h1>
          <p className="text-slate-500 mt-1 font-medium">Ready to continue your entrepreneurship journey?</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group flex-1 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fas fa-search text-slate-400 group-focus-within:text-nitrocrimson-600 transition-colors"></i>
            </div>
            <input
              type="text"
              placeholder="Search alliances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold shadow-sm focus:ring-4 focus:ring-nitrocrimson-500/10 focus:border-nitrocrimson-600 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center space-x-4 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-nitrocrimson-50 p-3 rounded-xl text-nitrocrimson-600">
              <i className="fas fa-calendar-alt text-lg"></i>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Active</p>
              <p className="text-base font-black">{enrolledCourses.length} Alliances</p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTINUE WATCHING SECTION - ADMIN ONLY */}
      {!searchQuery && enrolledCourses.length > 0 && isAdmin && (
        <section className="animate-slideUp">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center">
              <span className="w-1.5 h-6 bg-nitrocrimson-600 rounded-full mr-4"></span>
              Continue Resourcing (Admin Overview)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enrolledCourses.slice(0, 2).map(course => {
              const resumeLesson = getResumeLesson(course);
              const progPercent = getProgressValue(course.id);
              const expired = isAccessExpired(course.id);
              
              if (!resumeLesson || expired) return null;

              return (
                <div 
                  key={`resume-${course.id}`}
                  onClick={() => onSelectCourse(course)}
                  className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 cursor-pointer hover:shadow-2xl hover:shadow-nitrocrimson-100 group transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                  
                  <div className="w-full md:w-40 h-32 rounded-3xl overflow-hidden flex-shrink-0 relative border border-white/10">
                    <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                        <i className="fas fa-play text-xs ml-0.5"></i>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-nitrocrimson-500 text-[10px] font-black uppercase tracking-widest mb-1">Resume Briefing</p>
                      <h3 className="text-white text-xl font-black tracking-tight leading-tight group-hover:text-nitrocrimson-400 transition-colors">
                        {resumeLesson.title}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium mt-1">Next up in {course.title}</p>
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        <span>Briefing Status</span>
                        <span className="text-white">{progPercent}% Complete</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-nitrocrimson-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(234,0,39,0.5)]" style={{ width: `${progPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ALL COURSES SECTION */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900 flex items-center">
            <i className="fas fa-shield-alt mr-3 text-nitrocrimson-600"></i>
            Active Growth Alliances
          </h2>
          {searchQuery && (
            <span className="text-xs font-bold text-slate-400">
              Found {filteredCourses.length} matching alliances
            </span>
          )}
        </div>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => {
              const progPercent = getProgressValue(course.id);
              const expired = isAccessExpired(course.id);
              const daysLeft = getDaysRemaining(course.id);
              
              return (
                <div 
                  key={course.id}
                  onClick={() => !expired && onSelectCourse(course)}
                  className={`group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm transition-all duration-500 ${
                    expired 
                    ? 'opacity-75 cursor-not-allowed grayscale-[0.3]' 
                    : 'hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 cursor-pointer'
                  }`}
                >
                  <div className="relative h-52">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-nitrocrimson-600 text-[10px] font-black uppercase rounded-full shadow-lg tracking-wider">
                        {course.category}
                      </span>
                      {expired ? (
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg tracking-wider">
                          Access Terminated
                        </span>
                      ) : (
                        <span className={`px-3 py-1 ${daysLeft < 7 ? 'bg-orange-500' : 'bg-green-500'} text-white text-[10px] font-black uppercase rounded-full shadow-lg tracking-wider`}>
                          {daysLeft} Days Remaining
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${
                        course.level === 'Beginner' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {course.level} Level
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 tracking-tight">{course.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-2">{course.description}</p>
                    
                    <div className="mt-8">
                      <div className="flex justify-between text-[10px] font-black mb-3">
                        <span className="text-slate-400 uppercase tracking-widest">Mastery Progress</span>
                        <span className="text-nitrocrimson-600">{progPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-nitrocrimson-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(234,0,39,0.3)]"
                          style={{ width: `${progPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <button 
                      className={`w-full mt-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        expired 
                        ? 'bg-slate-100 text-slate-300' 
                        : 'bg-slate-900 text-white group-hover:bg-nitrocrimson-600 shadow-lg shadow-slate-100'
                      }`}
                    >
                      {expired ? 'Access Terminated' : progPercent === 0 ? 'Initialize Phase 1' : 'Resume Growth Stream'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-inner">
            <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <i className="fas fa-search text-4xl text-slate-200"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {searchQuery ? `No results for "${searchQuery}"` : "No Active Alliances"}
            </h3>
            <p className="text-slate-400 mt-3 max-w-sm mx-auto font-medium">
              {searchQuery 
                ? "Try adjusting your search terms to find the growth phase you're looking for." 
                : "You haven't been enrolled in any cohort streams yet. Access typically lasts 60 days per initialized phase."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
