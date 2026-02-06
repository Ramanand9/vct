import React, { useEffect, useMemo, useState } from "react";
import { useLMS } from "../store";
import { UserRole } from "../types";

type ChatScope = "community" | "admin";

type ChatMessage = {
  id: string;
  scope: ChatScope;
  fromUserId: string;
  fromName: string;
  // for admin chat: threadKey identifies which user's private thread it belongs to
  threadKey?: string; // userId of the non-admin participant
  text: string;
  createdAt: number;
};

const LS_KEY = "vrt_chat_v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadFromLS(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLS(messages: ChatMessage[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

const Community: React.FC = () => {
  const { currentUser, users } = useLMS();

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // ----- Storage-backed messages -----
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    setAllMessages(loadFromLS());
  }, []);

  useEffect(() => {
    saveToLS(allMessages);
  }, [allMessages]);

  // ----- UI state -----
  const [isCommunityOpen, setIsCommunityOpen] = useState(true);
  const [isConnectOpen, setIsConnectOpen] = useState(true);

  const [communityInput, setCommunityInput] = useState("");
  const [privateInput, setPrivateInput] = useState("");

  // Admin picks which user thread to view
  const [activeThreadUserId, setActiveThreadUserId] = useState<string | null>(null);

  // If admin: list of users who have started a private chat
  const privateThreads = useMemo(() => {
    const map = new Map<string, { userId: string; lastAt: number; lastText: string }>();

    for (const m of allMessages) {
      if (m.scope !== "admin") continue;
      const threadKey = m.threadKey;
      if (!threadKey) continue;

      const existing = map.get(threadKey);
      if (!existing || m.createdAt > existing.lastAt) {
        map.set(threadKey, { userId: threadKey, lastAt: m.createdAt, lastText: m.text });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt);
  }, [allMessages]);

  // Pick default admin thread
  useEffect(() => {
    if (!isAdmin) return;
    if (activeThreadUserId) return;
    if (privateThreads.length > 0) setActiveThreadUserId(privateThreads[0].userId);
  }, [isAdmin, privateThreads, activeThreadUserId]);

  const communityMessages = useMemo(
    () =>
      allMessages
        .filter((m) => m.scope === "community")
        .sort((a, b) => a.createdAt - b.createdAt),
    [allMessages]
  );

  // Private chat messages:
  // - If non-admin: threadKey = currentUser.id
  // - If admin: threadKey = activeThreadUserId
  const activeThreadKey = isAdmin ? activeThreadUserId : currentUser?.id ?? null;

  const privateMessages = useMemo(() => {
    if (!activeThreadKey) return [];
    return allMessages
      .filter((m) => m.scope === "admin" && m.threadKey === activeThreadKey)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [allMessages, activeThreadKey]);

  const sendCommunity = () => {
    if (!currentUser) return;
    const text = communityInput.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: uid(),
      scope: "community",
      fromUserId: currentUser.id,
      fromName: currentUser.name,
      text,
      createdAt: Date.now(),
    };

    setAllMessages((prev) => [...prev, msg]);
    setCommunityInput("");
  };

  const sendPrivate = () => {
    if (!currentUser) return;
    if (!activeThreadKey) return;

    const text = privateInput.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: uid(),
      scope: "admin",
      fromUserId: currentUser.id,
      fromName: currentUser.name,
      threadKey: activeThreadKey, // the non-admin user id
      text,
      createdAt: Date.now(),
    };

    setAllMessages((prev) => [...prev, msg]);
    setPrivateInput("");

    // If admin starts typing without selecting a thread, pick one
    if (isAdmin && !activeThreadUserId) setActiveThreadUserId(activeThreadKey);
  };

  const activeThreadUser = useMemo(() => {
    if (!activeThreadKey) return null;
    return users.find((u) => u.id === activeThreadKey) ?? null;
  }, [users, activeThreadKey]);

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      <header>
        <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">
          Community
        </p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          Community Chat
        </h1>
        <p className="text-slate-400 font-semibold mt-2 max-w-2xl">
          1) Public community chat for everyone. 2) Private “Connect with us” chat with Admin.
        </p>
      </header>

      {/* SECTION 1: COMMUNITY CHAT */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 md:p-10 flex items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/30">
          <div
            className="flex items-center gap-6 cursor-pointer"
            onClick={() => setIsCommunityOpen(!isCommunityOpen)}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 text-white transition-transform duration-500 ${
                isCommunityOpen ? "rotate-180" : ""
              }`}
            >
              <i className="fas fa-chevron-down"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                General Chat (Community)
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                Everyone can post • Everyone can see
              </p>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {communityMessages.length} messages
          </div>
        </div>

        {isCommunityOpen && (
          <div className="p-8 md:p-10 animate-slideUp">
            <div className="bg-slate-50/60 rounded-[2.5rem] border border-slate-100 p-6 md:p-8">
              <div className="max-h-[420px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {communityMessages.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-slate-900 font-black text-lg">No messages yet</div>
                    <div className="text-slate-400 font-semibold mt-1">
                      Be the first to say something 👋
                    </div>
                  </div>
                ) : (
                  communityMessages.map((m) => {
                    const mine = m.fromUserId === currentUser?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 border shadow-sm ${
                            mine
                              ? "bg-nitrocrimson-600 text-white border-nitrocrimson-600 rounded-tr-none"
                              : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                          }`}
                        >
                          {!mine && (
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
                              {m.fromName}
                            </div>
                          )}
                          <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="mt-6 flex gap-3">
                <input
                  value={communityInput}
                  onChange={(e) => setCommunityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendCommunity();
                  }}
                  placeholder="Write a message for everyone..."
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-300"
                />
                <button
                  type="button"
                  onClick={sendCommunity}
                  className="px-7 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: PRIVATE CHAT WITH ADMIN */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 md:p-10 flex items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/30">
          <div
            className="flex items-center gap-6 cursor-pointer"
            onClick={() => setIsConnectOpen(!isConnectOpen)}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-nitrocrimson-600 text-white transition-transform duration-500 ${
                isConnectOpen ? "rotate-180" : ""
              }`}
            >
              <i className="fas fa-chevron-down"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Connect With Us
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                any queries?
              </p>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {privateMessages.length} messages
          </div>
        </div>

        {isConnectOpen && (
          <div className="p-8 md:p-10 animate-slideUp">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Admin thread list */}
              {isAdmin && (
                <div className="lg:col-span-1 bg-slate-50/60 rounded-[2.5rem] border border-slate-100 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    Conversations
                  </div>

                  {privateThreads.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-semibold">
                      No one has messaged admin yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                      {privateThreads.map((t) => {
                        const u = users.find((x) => x.id === t.userId);
                        const active = activeThreadUserId === t.userId;
                        return (
                          <button
                            type="button"
                            key={t.userId}
                            onClick={() => setActiveThreadUserId(t.userId)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              active
                                ? "bg-white border-nitrocrimson-200 shadow-sm"
                                : "bg-white/40 border-slate-100 hover:bg-white"
                            }`}
                          >
                            <div className="font-black text-slate-900">
                              {u?.name ?? "Unknown user"}
                            </div>
                            <div className="text-xs font-medium text-slate-500 truncate mt-1">
                              {t.lastText}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Chat panel */}
              <div className={`${isAdmin ? "lg:col-span-2" : "lg:col-span-3"} bg-slate-50/60 rounded-[2.5rem] border border-slate-100 p-6 md:p-8`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Private thread
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      {isAdmin
                        ? activeThreadUser
                          ? `With: ${activeThreadUser.name}`
                          : "Select a conversation"
                        : "With: Admin"}
                    </div>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {!activeThreadKey ? (
                    <div className="py-16 text-center text-slate-400 font-semibold">
                      {isAdmin ? "Select a user conversation on the left." : "Loading..."}
                    </div>
                  ) : privateMessages.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="text-slate-900 font-black text-lg">No messages yet</div>
                      <div className="text-slate-400 font-semibold mt-1">
                        Send a private message to Admin here.
                      </div>
                    </div>
                  ) : (
                    privateMessages.map((m) => {
                      const mine = m.fromUserId === currentUser?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl p-4 border shadow-sm ${
                              mine
                                ? "bg-slate-900 text-white border-slate-900 rounded-tr-none"
                                : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                            }`}
                          >
                            <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                              {m.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="mt-6 flex gap-3">
                  <input
                    value={privateInput}
                    onChange={(e) => setPrivateInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendPrivate();
                    }}
                    placeholder={
                      isAdmin
                        ? activeThreadKey
                          ? "Reply as Admin..."
                          : "Select a conversation first..."
                        : "Message Admin privately..."
                    }
                    disabled={isAdmin && !activeThreadKey}
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={sendPrivate}
                    disabled={isAdmin && !activeThreadKey}
                    className="px-7 py-4 rounded-2xl bg-nitrocrimson-600 text-white font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-700 transition-colors disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Community;
