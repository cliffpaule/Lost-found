import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { messagesAPI } from '../services/api';
import useAuthStore from '../store/authStore';

function MessageBubble({ msg, isOwn }) {
  return (
    <div style={{
      display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
      gap: 8, marginBottom: 4, alignItems: 'flex-end'
    }}>
      {!isOwn && (
        <div className="avatar avatar-sm" style={{ background: 'var(--navy)', color: 'var(--gold-light)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          {msg.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
      )}
      <div style={{
        maxWidth: '70%', padding: '10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isOwn ? 'var(--navy)' : 'white',
        color: isOwn ? 'white' : 'var(--text-primary)',
        border: isOwn ? 'none' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
        <div style={{
          fontSize: 10, marginTop: 4,
          color: isOwn ? 'rgba(255,255,255,0.55)' : 'var(--text-light)',
          textAlign: isOwn ? 'right' : 'left'
        }}>
          {format(new Date(msg.created_at), 'h:mm a')}
          {isOwn && msg.is_read && ' · Read'}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }) {
  const label = isToday(new Date(date)) ? 'Today' : isYesterday(new Date(date)) ? 'Yesterday' : format(new Date(date), 'MMMM d, yyyy');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(userId ? parseInt(userId) : null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) loadMessages(activeConv);
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data.data);
    } catch {}
    finally { setConvLoading(false); }
  };

  const loadMessages = async (uid) => {
    try {
      const res = await messagesAPI.getMessages(uid);
      setMessages(res.data.data);
    } catch {}
  };

  const handleSend = async () => {
    if (!content.trim() || !activeConv) return;
    const text = content.trim();
    setContent('');
    // Optimistic UI
    const optimistic = {
      id: Date.now(), sender_id: user.id, receiver_id: activeConv,
      content: text, created_at: new Date().toISOString(),
      sender_name: user.full_name, is_read: false
    };
    setMessages(m => [...m, optimistic]);
    try {
      await messagesAPI.send(activeConv, { content: text });
      loadMessages(activeConv);
      loadConversations();
    } catch (err) {
      toast.error('Failed to send message');
      setMessages(m => m.filter(msg => msg.id !== optimistic.id));
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const activeConvData = conversations.find(c => c.other_user_id === activeConv);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = msg.created_at.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div style={{ padding: '32px 0 0', height: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' }}>
      <div className="container" style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-md)', maxHeight: 700 }}>

        {/* Sidebar — Conversations */}
        <div style={{ width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--navy)' }}>Messages</h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <MessageCircle size={32} color="var(--text-light)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No conversations yet.<br />Browse items to start chatting.</p>
                <Link to="/browse" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>Browse Items</Link>
              </div>
            ) : conversations.map(conv => (
              <div key={conv.other_user_id} onClick={() => { setActiveConv(conv.other_user_id); navigate(`/messages/${conv.other_user_id}`); }}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--cream-dark)',
                  background: activeConv === conv.other_user_id ? 'var(--cream-dark)' : 'white',
                  transition: 'background 0.15s', borderLeft: activeConv === conv.other_user_id ? '3px solid var(--navy)' : '3px solid transparent'
                }}>
                <div className="flex items-center gap-3">
                  <div className="avatar" style={{ background: 'var(--navy)', color: 'var(--gold-light)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {conv.other_user_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }} className="truncate">{conv.other_user_name}</span>
                      {conv.unread_count > 0 && (
                        <span style={{ background: 'var(--gold)', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '1px 7px', flexShrink: 0 }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
                      {conv.last_message || 'No messages yet'}
                    </div>
                    {conv.student_id && <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{conv.student_id}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {activeConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ background: 'var(--navy)', color: 'var(--gold-light)', fontSize: 13, fontWeight: 700 }}>
                {(activeConvData?.other_user_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{activeConvData?.other_user_name || `User #${activeConv}`}</div>
                {activeConvData?.student_id && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeConvData.student_id}</div>}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <h3>Start the conversation</h3>
                  <p>Send a message about the item</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <DateDivider date={date} />
                    {msgs.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user.id} />
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: '10px 14px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                  maxHeight: 120, overflowY: 'auto', lineHeight: 1.5
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
              <button onClick={handleSend} disabled={!content.trim()}
                className="btn btn-primary"
                style={{ padding: '10px 16px', flexShrink: 0, alignSelf: 'flex-end' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
            <MessageCircle size={48} style={{ opacity: 0.3 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-secondary)' }}>Select a conversation</h3>
            <p style={{ fontSize: 14 }}>Or go to an item page to start messaging</p>
            <Link to="/browse" className="btn btn-outline" style={{ marginTop: 8 }}>Browse Items</Link>
          </div>
        )}
      </div>
    </div>
  );
}
