import { UserRole } from '../types';
import React, { useEffect, useMemo, useState } from 'react';
import { useLMS } from '../store';
import type { CommunityPost } from '../types';
import { supabase } from '../services/supabaseClient';


const Community: React.FC = () => {
  const { users, currentUser, posts } = useLMS();
  const [activeTab, setActiveTab] = useState<'feed' | 'messages' | 'members'>('feed');
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);
const [newTitle, setNewTitle] = useState('');
const [newBody, setNewBody] = useState('');
const [newType, setNewType] = useState<'win' | 'question' | 'resource' | 'help'>('win');
const [posting, setPosting] = useState(false);
const loadFeed = async () => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!error && data) {
    setFeedPosts(data);
  }
};



  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <header>
        <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">Global Network</p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Alliance Hub</h1>
      </header>

      {/* SECTION ONE: COMMUNITY HUB */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setIsSection1Open(!isSection1Open)}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 text-white transition-transform duration-500 ${isSection1Open ? 'rotate-180' : ''}`}>
               <i className="fas fa-chevron-down"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Community Engine</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Networking & Engagement</p>
            </div>
          </div>
          
          <button className="group bg-nitrocrimson-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-nitrocrimson-100 hover:bg-nitrocrimson-700 transition-all">
            <i className="fas fa-cloud-download-alt group-hover:translate-y-1 transition-transform"></i>
            Download Member Directory
          </button>
        </div>

        {isSection1Open && (
          <div className="p-8 md:p-12 animate-slideUp">
            {/* Inner Nav */}
            <div className="flex gap-4 mb-10 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'feed', label: 'Community Feed', icon: 'fa-newspaper' },
                { id: 'messages', label: 'Messages', icon: 'fa-comment-alt' },
                { id: 'members', label: 'Community', icon: 'fa-users' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-3 ${
                    activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {posts.map(post => (
                  <div key={post.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://picsum.photos/seed/${post.userId}/200`} alt="" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{post.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{post.type} • Today</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-nitrocrimson-600 transition-colors">{post.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">{post.body}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                       <div className="flex items-center gap-6">
                         <button className="flex items-center gap-2 text-slate-400 hover:text-nitrocrimson-600 font-black text-[10px] uppercase">
                           <i className="far fa-heart"></i> {post.likes}
                         </button>
                         <button className="flex items-center gap-2 text-slate-400 hover:text-nitrocrimson-600 font-black text-[10px] uppercase">
                           <i className="far fa-comment"></i> {post.commentsCount}
                         </button>
                       </div>
                       <button className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fas fa-share-alt"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-nitrocrimson-600 mb-6 shadow-sm">
                  <i className="fas fa-envelope-open-text text-3xl"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Encrypted Messaging</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs text-center font-medium">Select a partner from the community directory to start a secure conversation.</p>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {users.slice(0, 8).map(u => (
                  <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center hover:shadow-xl hover:border-nitrocrimson-200 transition-all cursor-pointer">
                    <img src={u.avatar} className="w-16 h-16 rounded-2xl mx-auto mb-4 border-2 border-white shadow-md" alt="" />
                    <p className="font-black text-slate-900 truncate">{u.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{u.role}</p>
                    <button className="w-full py-2 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-nitrocrimson-600 hover:text-white transition-all">View Profile</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION TWO: GROWTH HUB */}
      <section className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <i className="fas fa-rocket text-[12rem] text-white"></i>
        </div>
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setIsSection2Open(!isSection2Open)}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-nitrocrimson-600 text-white transition-transform duration-500 ${isSection2Open ? 'rotate-180' : ''}`}>
               <i className="fas fa-chevron-down"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Growth Resources</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Accelerated Insights & Action</p>
            </div>
          </div>
          
          <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-nitrocrimson-600 hover:text-white transition-all">
            <i className="fas fa-toolbox"></i>
            Download Growth Kit
          </button>
        </div>

        {isSection2Open && (
          <div className="p-8 md:p-12 animate-slideUp">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* INSIGHTS COLUMN */}
              <div className="xl:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-white flex items-center">
                     <span className="w-1.5 h-6 bg-nitrocrimson-600 rounded-full mr-4"></span>
                     Entrepreneurs Insights
                   </h3>
                   <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Weekly Strategy</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-nitrocrimson-600/20 text-nitrocrimson-500 rounded-2xl flex items-center justify-center mb-6">
                      <i className="fas fa-lightbulb"></i>
                    </div>
                    <h4 className="text-white font-black text-lg mb-3 tracking-tight group-hover:text-nitrocrimson-400 transition-colors">Market Domination Phase 2</h4>
                    <p className="text-white/50 text-xs font-medium leading-relaxed">Exclusive deep-dive into high-conversion funnels for the Q4 cycle.</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <h4 className="text-white font-black text-lg mb-3 tracking-tight group-hover:text-blue-400 transition-colors">Scale-Up Unit Economics</h4>
                    <p className="text-white/50 text-xs font-medium leading-relaxed">Understanding the LTV:CAC ratio during aggressive scaling.</p>
                  </div>
                </div>
              </div>

              {/* CONNECT & POST COLUMN */}
              <div className="space-y-8">
                {/* CHAT & CONNECT */}
                <div className="bg-gradient-to-br from-nitrocrimson-600 to-nitrocrimson-800 rounded-[2.5rem] p-10 shadow-2xl shadow-nitrocrimson-900/50 group hover:-translate-y-2 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-10">
                    <div className="text-4xl">✉️</div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"><i className="fas fa-arrow-right"></i></div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Chat & Connect</h3>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Instant Advisor Access</p>
                </div>

                {/* POST EXERCISES */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/20 group hover:-translate-y-2 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-10">
                    <div className="text-4xl">📹</div>
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white group-hover:bg-nitrocrimson-600 transition-colors"><i className="fas fa-plus"></i></div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Post Exercises Here</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Video Case Study Upload</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Community;
