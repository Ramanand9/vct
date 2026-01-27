
import React, { useState, useEffect, useRef } from 'react';
import { useLMS } from '../store';
import { Course, Lesson, Attachment, UserRole } from '../types';
import { summarizeLesson, getDiscoverySuggestions } from '../services/gemini';
import { generateCoursePDF } from '../components/CertificateGenerator';

const isDirectVideoFile = (url?: string) => {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname);
  } catch {
    // allow local blob: URLs from URL.createObjectURL(file)
    return /^blob:/.test(url) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  }
};

const getExternalProvider = (url?: string) => {
  if (!url) return null;
  const s = url.toLowerCase();
  if (s.includes('youtube.com') || s.includes('youtu.be')) return 'YouTube';
  if (s.includes('vimeo.com')) return 'Vimeo';
  return 'External';
};


const CoursePlayer: React.FC<{ courseId: string; onBack: () => void; initialLessonId?: string | null }> =
({ courseId, onBack, initialLessonId = null }) => {

  const { currentUser, courses, markLessonComplete, submitWorksheet, isLessonLocked, isLessonCompleted, isWorksheetSubmitted, isCourseCompleted, updateCourse } = useLMS();
  
  // Find current course from store to ensure reactivity when updates occur
  const course = courses.find(c => c.id === courseId);
  
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [discoveryData, setDiscoveryData] = useState<any>(null);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [worksheetInput, setWorksheetInput] = useState('');
  const [showEmailToast, setShowEmailToast] = useState(false);
  const [showFloatingDone, setShowFloatingDone] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Custom Video Player States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!course) return;
      // If admin/architect preview requested a specific lesson, honor it
  if (initialLessonId) {
    const exists = course.modules.some(m => m.lessons.some(l => l.id === initialLessonId));
    if (exists) {
      setActiveLessonId(initialLessonId);
      return;
    }
  }
    // Find first uncompleted lesson to resume exactly where left off
    let resumeLessonId = null;
    for (const m of course.modules) {
      for (const l of m.lessons) {
        if (!isLessonCompleted(course.id, l.id)) {
          resumeLessonId = l.id;
          break;
        }
      }
      if (resumeLessonId) break;
    }
    setActiveLessonId(resumeLessonId || course.modules[0]?.lessons[0]?.id || null);
  }, [course?.id]);

  const activeLesson = course?.modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId) || course?.modules[0]?.lessons[0];
  const courseDone = course ? isCourseCompleted(course.id) : false;

  // AI Discovery Trigger
  useEffect(() => {
    const fetchDiscovery = async () => {
      if (!activeLesson) return;
      setIsLoadingDiscovery(true);
      // Fix: Explicitly type themes as string[] to resolve the type inference error
      const themes: string[] = Array.from(new Set(courses.map(c => c.title)));
      const data = await getDiscoverySuggestions(activeLesson.title, activeLesson.textNotes, themes);
      setDiscoveryData(data);
      setIsLoadingDiscovery(false);
    };
    fetchDiscovery();
  }, [activeLessonId, courses]);

  // Trigger Celebration when course completes
  useEffect(() => {
    if (course && courseDone) {
      const hasSeenCelebration = sessionStorage.getItem(`celebrated_${course.id}`);
      if (!hasSeenCelebration) {
        setShowCelebration(true);
        sessionStorage.setItem(`celebrated_${course.id}`, 'true');
      }
    }
  }, [courseDone, course?.id]);

  useEffect(() => {
  setIsPlaying(false);
  setProgress(0);
  setShowFloatingDone(false);
}, [activeLessonId]);


  const handleTimeUpdate = () => {
    if (videoRef.current && course && activeLesson) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
      if (p > 90 && !isLessonCompleted(course.id, activeLesson.id)) {
        setShowFloatingDone(true);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleComplete = () => {
    if (activeLesson && course) {
      markLessonComplete(course.id, activeLesson.id);
      setShowFloatingDone(false);
    }
  };
  
  const handleSubmitWorksheet = () => {
    if (activeLesson && course && worksheetInput.trim()) {
      submitWorksheet(course.id, activeLesson.id, worksheetInput);
      setWorksheetInput('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSummarize = async () => {
    if (!activeLesson) return;
    setIsSummarizing(true);
    setAiSummary(await summarizeLesson(activeLesson.title, activeLesson.textNotes));
    setIsSummarizing(false);
  };

  const handleDownloadCertificate = () => {
    if (currentUser && course && isCourseCompleted(course.id)) {
      generateCoursePDF(currentUser, course);
      setShowEmailToast(true);
      setShowCelebration(false);
      setTimeout(() => setShowEmailToast(false), 5000);
    }
  };

  const toggleAttachmentPermission = (attachmentId: string) => {
    if (!isAdmin || !activeLesson || !course) return;
    
    const updatedModules = course.modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => {
        if (l.id !== activeLesson.id) return l;
        return {
          ...l,
          attachments: l.attachments.map(at => 
            at.id === attachmentId ? { ...at, downloadable: !at.downloadable } : at
          )
        };
      })
    }));

    updateCourse(course.id, { modules: updatedModules });
  };

  if (!course || !activeLesson) return <div className="p-20 text-center font-black text-slate-300">Initializing Alliance Stream...</div>;

  const completed = isLessonCompleted(course.id, activeLesson.id);
  const submitted = isWorksheetSubmitted(course.id, activeLesson.id);

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn max-w-7xl mx-auto pb-20 relative">
      
      {/* MASTERY CELEBRATION MODAL */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl" onClick={() => setShowCelebration(false)}></div>
          
          <div className="relative bg-white rounded-[4rem] p-12 md:p-16 max-w-3xl w-full text-center shadow-2xl border border-white/20 animate-scaleIn overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-nitrocrimson-600 via-yellow-400 to-nitrocrimson-600"></div>
            <div className="w-24 h-24 bg-nitrocrimson-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-nitrocrimson-600 shadow-xl shadow-nitrocrimson-100 animate-bounce">
               <i className="fas fa-trophy text-4xl"></i>
            </div>
            <p className="text-[12px] font-black uppercase text-nitrocrimson-600 tracking-[0.4em] mb-4">Strategic Mastery Attained</p>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Course Completed!</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12 max-w-xl mx-auto">
              You have successfully cleared all Mastery Gates for <strong>{course.title}</strong>. Your executive credentials have been verified and are ready for dispatch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleDownloadCertificate}
                className="bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-nitrocrimson-600 transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                <i className="fas fa-certificate text-xl"></i>
                Download Certificate
              </button>
              <button 
                onClick={() => setShowCelebration(false)}
                className="bg-slate-50 text-slate-400 px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1 space-y-8">
        <div>
          <button 
            onClick={onBack} 
            className="group text-slate-400 hover:text-nitrocrimson-600 mb-8 font-black flex items-center transition-colors text-sm uppercase tracking-widest"
          >
            <i className="fas fa-chevron-left mr-3 group-hover:-translate-x-1 transition-transform"></i> Exit Alliance
          </button>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-8">
            <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
              <p className="text-[10px] font-black uppercase text-nitrocrimson-400 mb-1 tracking-widest">Curriculum Pathway</p>
              <h2 className="font-black text-lg leading-tight">{course.title}</h2>
              {courseDone && (
                <div className="mt-4 flex items-center gap-2 bg-nitrocrimson-600/30 px-3 py-1.5 rounded-xl border border-nitrocrimson-500/50 w-fit">
                    <i className="fas fa-certificate text-[10px] text-white"></i>
                    <span className="text-[9px] font-black uppercase tracking-widest">Mastery Gate: Cleared</span>
                </div>
              )}
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {course.modules.map(m => (
                <div key={m.id}>
                  <div className="px-8 py-4 bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-y border-slate-100 tracking-widest flex justify-between">
                    <span>{m.title}</span>
                    <i className="fas fa-layer-group"></i>
                  </div>
                  {m.lessons.map(l => {
                    const locked = isLessonLocked(course.id, l.id);
                    const isLCompleted = isLessonCompleted(course.id, l.id);
                    const isLSubmitted = isWorksheetSubmitted(course.id, l.id);
                    const isCurrent = activeLesson.id === l.id;
                    
                    return (
                      <button
                        key={l.id}
                        disabled={locked}
                        onClick={() => { setActiveLessonId(l.id); setAiSummary(null); setShowFloatingDone(false); setDiscoveryData(null); }}
                        className={`w-full flex items-center px-8 py-5 text-left border-b border-slate-50 transition-all group ${
                          isCurrent ? 'bg-nitrocrimson-50 border-r-4 border-nitrocrimson-600' : ''
                        } ${locked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 text-xs font-black transition-all ${
                          isLCompleted && isLSubmitted 
                            ? 'bg-green-100 text-green-600 shadow-sm' 
                            : locked 
                              ? 'bg-slate-100 text-slate-300' 
                              : isCurrent
                                ? 'bg-nitrocrimson-600 text-white shadow-lg shadow-nitrocrimson-200'
                                : 'bg-white border-2 border-slate-100 text-slate-400 group-hover:border-nitrocrimson-200'
                        }`}>
                          {isLCompleted && isLSubmitted ? <i className="fas fa-check-double"></i> : locked ? <i className="fas fa-lock"></i> : l.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-bold block truncate ${isCurrent ? 'text-nitrocrimson-700' : 'text-slate-700'}`}>{l.title}</span>
                          {!locked && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{l.duration} Stream</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI DISCOVERY SECTION */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group/discovery">
          <div className="absolute top-0 right-0 w-24 h-24 bg-nitrocrimson-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
          
          <h3 className="text-xs font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
            <i className="fas fa-sparkles text-nitrocrimson-600"></i>
            Strategic Discovery
          </h3>

          {isLoadingDiscovery ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-slate-50 rounded-2xl"></div>
              <div className="h-20 bg-slate-50 rounded-2xl"></div>
            </div>
          ) : discoveryData ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Internal Recommendation */}
              <div className="bg-nitrocrimson-50/50 p-5 rounded-2xl border border-nitrocrimson-100">
                <p className="text-[9px] font-black text-nitrocrimson-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <i className="fas fa-vial"></i> VRT Complementary
                </p>
                <h4 className="text-xs font-black text-slate-900 mb-2">{discoveryData.internalRecommendation.theme}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{discoveryData.internalRecommendation.rationale}</p>
              </div>

              {/* External Resources */}
              {discoveryData.externalResources.map((res: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-nitrocrimson-200 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <i className={`fas ${res.type.toLowerCase().includes('book') ? 'fa-book' : 'fa-compass'}`}></i> {res.type}
                  </p>
                  <h4 className="text-xs font-black text-slate-900 mb-2">{res.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{res.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-300 font-bold italic text-center py-4">Analysis in progress...</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-8 order-1 lg:order-2">
        {showEmailToast && (
          <div className="fixed top-8 right-8 z-[100] bg-slate-900 text-white p-6 rounded-[1.5rem] shadow-2xl border border-nitrocrimson-600 animate-slideUp flex items-center gap-4">
            <div className="w-10 h-10 bg-nitrocrimson-600 rounded-full flex items-center justify-center text-white">
              <i className="fas fa-paper-plane"></i>
            </div>
            <div>
              <p className="font-black text-sm">Certificate Dispatched</p>
              <p className="text-[10px] opacity-70">Secured PDF generated successfully.</p>
            </div>
          </div>
        )}

        {courseDone && (
          <div className="bg-gradient-to-r from-nitrocrimson-600 to-nitrocrimson-800 rounded-[2.5rem] p-12 text-white shadow-2xl shadow-nitrocrimson-200 animate-slideUp relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-white/20">
                  <i className="fas fa-trophy"></i> Curriculum Mastery Attained
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4">Mastery Gate Cleared!</h2>
                <p className="text-white/80 font-medium max-w-lg leading-relaxed">
                  You have successfully navigated all growth phases. Your strategic deployment plans have been verified.
                </p>
              </div>
              <button 
                onClick={handleDownloadCertificate}
                className="bg-white text-nitrocrimson-600 px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-50 transition-all flex items-center gap-4 group active:scale-95"
              >
                <i className="fas fa-certificate text-xl group-hover:rotate-12 transition-transform"></i>
                Claim Certificate (PDF)
              </button>
            </div>
          </div>
        )}

        {(showFloatingDone || completed) && !submitted && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[40] animate-slideUp w-full max-w-md px-4">
            <div className="bg-slate-900 border-2 border-nitrocrimson-600 p-2 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4 pl-4">
                <div className="w-10 h-10 bg-nitrocrimson-600 rounded-full flex items-center justify-center text-white">
                   <i className={`fas ${completed ? 'fa-check' : 'fa-play-circle animate-pulse'}`}></i>
                </div>
                <p className="text-white text-[10px] font-black uppercase tracking-widest">
                  {completed ? 'Briefing Logged' : 'Briefing Complete?'}
                </p>
              </div>
              {!completed ? (
                <button 
                  onClick={handleComplete}
                  className="bg-white text-slate-900 px-8 py-3.5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-nitrocrimson-600 hover:text-white transition-all shadow-lg active:scale-95"
                >
                  Mark Complete
                </button>
              ) : (
                <div className="pr-6 text-nitrocrimson-400 text-[10px] font-black uppercase tracking-widest">
                  Deploy Plan Below <i className="fas fa-arrow-down ml-2"></i>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Phase {activeLesson.order} Protocol</span>
              {completed && submitted && (
                <div className="flex items-center gap-2 text-green-600">
                  <i className="fas fa-check-double text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Mission Cleared</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-black text-slate-900 leading-tight mb-8 tracking-tighter">{activeLesson.title}</h1>
            <div
  ref={playerContainerRef}
  className="bg-black rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl relative group mb-8 select-none border-4 border-slate-900"
  onContextMenu={(e) => e.preventDefault()}
>
  {isDirectVideoFile(activeLesson.videoUrl) ? (
    <>
      <video
        ref={videoRef}
        key={activeLesson.videoUrl}
        src={activeLesson.videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        playsInline
      />
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer z-20"
        >
          <div className="w-24 h-24 bg-nitrocrimson-600 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse">
            <i className="fas fa-play ml-1"></i>
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
      <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-[2rem] p-10 backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-3">
          External Video
        </p>
        <h3 className="text-2xl font-black text-white mb-3">
          {getExternalProvider(activeLesson.videoUrl)} Lesson
        </h3>
        <p className="text-white/70 text-sm font-medium mb-8 break-all">
          {activeLesson.videoUrl}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={activeLesson.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-nitrocrimson-700 transition-all inline-flex items-center justify-center gap-3"
          >
            <i className="fas fa-arrow-up-right-from-square"></i>
            Watch on {getExternalProvider(activeLesson.videoUrl)}
          </a>

          {!completed && (
            <button
              onClick={handleComplete}
              className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:border-white/30 transition-all inline-flex items-center justify-center gap-3"
              title="Use this after you've watched the video on the external site."
            >
              <i className="fas fa-check"></i>
              I watched it
            </button>
          )}
        </div>

        <p className="text-white/40 text-[10px] font-bold mt-6">
          Note: external providers can’t be tracked for watch progress inside VRT.
        </p>
      </div>
    </div>
  )}
</div>

            {/* <div 
              ref={playerContainerRef}
              className="bg-black rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl relative group mb-8 select-none border-4 border-slate-900"
              onContextMenu={(e) => e.preventDefault()}
            >
              <video 
                ref={videoRef}
                key={activeLesson.videoUrl} 
                src={activeLesson.videoUrl} 
                className="w-full h-full object-contain" 
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                playsInline
              />
              {!isPlaying && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer z-20">
                  <div className="w-24 h-24 bg-nitrocrimson-600 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse">
                    <i className="fas fa-play ml-1"></i>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="order-1 xl:order-2 space-y-8">
            <div className={`relative bg-white rounded-[2.5rem] p-10 border-4 border-slate-50 transition-all ${submitted ? 'bg-green-50/20' : 'shadow-2xl shadow-slate-200'}`}>
              <div className="flex items-center gap-5 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${submitted ? 'bg-green-100 text-green-600' : 'bg-nitrocrimson-50 text-nitrocrimson-600'}`}>
                  <i className={submitted ? "fas fa-clipboard-check" : "fas fa-clipboard-list"}></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Phase Deployment Plan</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Actionable Submission Required</p>
                </div>
              </div>

              {submitted ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white p-8 rounded-[2rem] border-2 border-green-100 shadow-sm">
                    <p className="text-slate-600 font-medium italic leading-relaxed">"{worksheetInput || 'Your strategic deployment plan has been successfully uploaded.'}"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <textarea 
                    value={worksheetInput}
                    onChange={e => setWorksheetInput(e.target.value)}
                    placeholder="Describe your execution strategy..."
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] px-8 py-8 focus:ring-4 focus:ring-nitrocrimson-500/10 focus:border-nitrocrimson-600 outline-none h-64 text-base font-bold text-slate-800 transition-all placeholder:text-slate-200"
                  />
                  <button 
                    onClick={handleSubmitWorksheet}
                    disabled={!worksheetInput.trim() || !completed}
                    className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] font-black text-sm uppercase tracking-widest hover:bg-nitrocrimson-600 shadow-2xl shadow-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                  >
                    {!completed ? <i className="fas fa-lock text-xs"></i> : <i className="fas fa-paper-plane text-xs"></i>}
                    {!completed ? 'Briefing Required' : 'Log Deployment Plan'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
               <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center">
                  <i className="fas fa-folder-open text-nitrocrimson-600 mr-4"></i>
                  Growth Assets
               </h3>
               <div className="space-y-4">
                  {activeLesson.attachments.length > 0 ? activeLesson.attachments.map((at) => (
                    <div key={at.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                             at.type === 'pdf' ? 'bg-red-50 text-red-500' :
                             at.type === 'image' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'
                          }`}>
                             <i className={
                               at.type === 'pdf' ? 'fas fa-file-pdf' :
                               at.type === 'image' ? 'fas fa-image' :
                               at.type === 'link' ? 'fas fa-link' : 'fas fa-file-alt'
                             }></i>
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900">{at.name}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{at.type} Resource</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          {/* Admin Only Toggle to allow student download */}
                          {isAdmin && (
                            <label className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer hover:border-nitrocrimson-200 hover:shadow-sm transition-all group/toggle">
                              <input 
                                type="checkbox" 
                                checked={at.downloadable} 
                                onChange={() => toggleAttachmentPermission(at.id)}
                                className="w-4 h-4 rounded text-nitrocrimson-600 border-slate-300 focus:ring-nitrocrimson-500 transition-all"
                              />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight group-hover/toggle:text-nitrocrimson-600 transition-colors">Allow Student Download</span>
                              </div>
                            </label>
                          )}

                          {/* Action Button: Download (for all if allowed, or always for Admin) / Eye Icon (if restricted) */}
                          {(at.downloadable || isAdmin) ? (
                             <a 
                              href={at.url} 
                              download 
                              className="w-10 h-10 bg-nitrocrimson-600 text-white rounded-xl flex items-center justify-center hover:bg-nitrocrimson-700 transition-all shadow-lg active:scale-95"
                              title={isAdmin && !at.downloadable ? "Admin Preview Download" : "Download Resource"}
                             >
                                <i className="fas fa-download"></i>
                             </a>
                          ) : (
                             <div className="w-10 h-10 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center cursor-help" title="Restricted to View Only">
                                <i className="fas fa-eye"></i>
                             </div>
                          )}
                       </div>
                    </div>
                  )) : (
                    <p className="text-center py-6 text-slate-300 font-bold text-xs italic">No static assets.</p>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-8 order-2 xl:order-1">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-nitrocrimson-600 rounded-full mr-4"></span>
                Strategic Intelligence
              </h3>
              <div className="prose prose-slate max-w-none text-slate-500 font-bold leading-relaxed whitespace-pre-line text-sm">
                {activeLesson.textNotes}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #EA0027; }
      `}</style>
    </div>
  );
};

export default CoursePlayer;
