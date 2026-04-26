import React from 'react';
import { FiMessageCircle, FiRefreshCw, FiSend, FiX, FiUsers, FiClock } from 'react-icons/fi';

const SUPPORT_CHANNELS = [
  { key: 'support', label: 'Support' },
  { key: 'sales', label: 'Sales' },
];

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function SupportBadge({ value, tone = 'slate' }) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    sky: 'bg-sky-100 text-sky-700',
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.slate}`}>{value}</span>;
}

export function SupportInbox() {
  const [channel, setChannel] = React.useState('support');
  const [status, setStatus] = React.useState('open');
  const [conversations, setConversations] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(0);
  const [conversation, setConversation] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [inboxError, setInboxError] = React.useState('');
  const [detailError, setDetailError] = React.useState('');
  const listRef = React.useRef(null);

  const fetchSupportJson = async (path, options = {}) => {
    const response = await fetch(`/api/support${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to load support inbox');
    }
    return payload;
  };

  const loadInbox = React.useCallback(
    async (preserveSelected = true) => {
      setLoading(true);
      setInboxError('');
      try {
        const payload = await fetchSupportJson(
          `/inbox?channel=${encodeURIComponent(channel)}&status=${encodeURIComponent(status)}`
        );
        const nextConversations = Array.isArray(payload?.conversations) ? payload.conversations : [];
        setConversations(nextConversations);

        const currentStillExists = preserveSelected && nextConversations.some((item) => Number(item.id) === Number(selectedId));
        if (!currentStillExists) {
          const nextId = nextConversations[0]?.id || 0;
          setSelectedId(Number(nextId) || 0);
          if (nextId) {
            await loadThread(nextId);
          } else {
            setConversation(null);
            setMessages([]);
          }
        }
      } catch (loadError) {
        setInboxError(loadError?.message || 'Failed to load support inbox');
      } finally {
        setLoading(false);
      }
    },
    [channel, selectedId, status]
  );

  const loadThread = React.useCallback(async (id) => {
    if (!id) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setDetailLoading(true);
    setDetailError('');
    try {
      const payload = await fetchSupportJson(`/thread?id=${encodeURIComponent(id)}`);
      setConversation(payload?.conversation || null);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
    } catch (loadError) {
      setDetailError(loadError?.message || 'Failed to load conversation');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInbox(false);
    const timer = window.setInterval(() => {
      loadInbox(true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [channel, status, loadInbox]);

  React.useEffect(() => {
    if (!selectedId) {
      return;
    }
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  React.useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const activeConversation = conversation || conversations.find((item) => Number(item.id) === Number(selectedId)) || null;

  const handleSelect = (item) => {
    const nextId = Number(item.id) || 0;
    setSelectedId(nextId);
    loadThread(nextId);
  };

  const handleReply = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedId || !text) {
      setError('Write a reply first.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const payload = await fetchSupportJson('/thread', {
        method: 'POST',
        body: JSON.stringify({
          id: Number(selectedId),
          message: text,
        }),
      });

      setConversation(payload?.conversation || null);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      setDraft('');
      await loadInbox(true);
    } catch (sendError) {
      setError(sendError?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedId) {
      return;
    }

    setSending(true);
    setError('');
    try {
      const payload = await fetchSupportJson('/thread', {
        method: 'POST',
        body: JSON.stringify({
          id: Number(selectedId),
          message: '',
          status: 'closed',
        }),
      });

      setConversation(payload?.conversation || null);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      await loadInbox(true);
    } catch (closeError) {
      setError(closeError?.message || 'Failed to close conversation');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Support</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Sales and support inbox</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Incoming chat from diworkin.com lands here by channel. Pick Sales or Support, then reply directly from the panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SupportBadge value={`${conversations.filter((item) => item.unread_for_admin).length} unread`} tone="rose" />
          <SupportBadge value={`${conversations.length} threads`} tone="slate" />
        </div>
      </div>

      {inboxError ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{inboxError}</p> : null}
      {detailError ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{detailError}</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {SUPPORT_CHANNELS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setChannel(item.key);
              setSelectedId(0);
              setConversation(null);
              setMessages([]);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              channel === item.key
                ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
        {['open', 'closed', 'all'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === item
                ? 'bg-emerald-100 text-emerald-700'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item === 'all' ? 'All' : item === 'open' ? 'Open' : 'Closed'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => loadInbox(true)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FiRefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-[580px] rounded-[1.8rem] border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <p className="text-sm font-medium text-slate-400">Threads</p>
              <h3 className="text-lg font-semibold text-slate-950">{channel === 'sales' ? 'Sales' : 'Support'} queue</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {loading ? 'Loading...' : `${conversations.length} total`}
            </span>
          </div>

          <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {conversations.length === 0 && !loading ? (
              <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No conversations for this channel yet.
              </div>
            ) : null}

            {conversations.map((item) => {
              const active = Number(item.id) === Number(selectedId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full rounded-[1.3rem] border p-4 text-left transition ${
                    active
                      ? 'border-slate-900 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.04)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {item.visitor_name || item.visitor_email || 'Anonymous visitor'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.visitor_email || 'No email'} {item.visitor_company ? `· ${item.visitor_company}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.unread_for_admin ? <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
                      <SupportBadge value={item.status} tone={item.status === 'closed' ? 'slate' : 'emerald'} />
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.last_message_preview || 'No preview available.'}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <FiMessageCircle className="h-3.5 w-3.5" />
                      {item.message_count || 0} messages
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FiClock className="h-3.5 w-3.5" />
                      {formatTime(item.last_message_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[580px] rounded-[1.8rem] border border-slate-200 bg-white p-4">
          {activeConversation ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Conversation</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">
                    {activeConversation.visitor_name || activeConversation.visitor_email || `Conversation #${activeConversation.id}`}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {activeConversation.visitor_email || 'No email'} {activeConversation.visitor_company ? `· ${activeConversation.visitor_company}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SupportBadge value={activeConversation.channel} tone={activeConversation.channel === 'sales' ? 'sky' : 'emerald'} />
                  <SupportBadge value={activeConversation.status} tone={activeConversation.status === 'closed' ? 'slate' : 'amber'} />
                  <button
                    type="button"
                    onClick={closeConversation}
                    disabled={sending || activeConversation.status === 'closed'}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <FiX className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>

              <div ref={listRef} className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-[1.5rem] bg-slate-50 p-4">
                {detailLoading && messages.length === 0 ? (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading thread...</div>
                ) : null}

                {messages.map((message) => {
                  const isAdmin = message.sender_role === 'admin';
                  return (
                    <div key={`${message.id}-${message.created_at}`} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                          isAdmin
                            ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]'
                            : 'border border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p className={`mt-2 text-[10px] uppercase tracking-[0.18em] ${isAdmin ? 'text-white/60' : 'text-slate-400'}`}>
                          {isAdmin ? message.sender_email || 'Admin' : 'Visitor'} · {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <label className="sr-only" htmlFor="support-admin-reply">
                  Reply
                </label>
                <textarea
                  id="support-admin-reply"
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type your reply..."
                  className="w-full resize-none rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {detailLoading ? 'Syncing conversation...' : `${messages.length} messages in this thread`}
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <FiSend className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-950 text-white">
                  <FiUsers className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">Select a conversation</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Open a support or sales thread from the list to reply to the visitor.
                </p>
                {loading ? <p className="mt-4 text-sm text-slate-500">Loading inbox...</p> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SupportInbox;

