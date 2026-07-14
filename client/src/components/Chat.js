import React, { useEffect, useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { getMessages } from '../services/api';
import Message from './Message';
import { addToast } from './ToastContainer';

export default function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [ws, setWs] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const bottomRef = useRef();
  const fileInputRef = useRef();
  const token = localStorage.getItem('token');

  // Extract a reliable logged-in User ID (works for SQL auto-increment 'id' or MongoDB '_id')
  const loggedInUserId = user?.id || user?._id;

  // Time tracker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Message History & Start Sockets
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await getMessages(token);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to resolve messages:', err);
        addToast('Error loading chat history', 'danger');
      }
    };

    loadConversation();

    const socket = new WebSocket('ws://localhost:5000');
    setWs(socket);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.type === 'message') {
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.data.id)) return prev;
          return [...prev, payload.data];
        });
      } else if (payload.type === 'message_edit') {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.data.id ? { ...m, content: payload.data.content, edited: true } : m))
        );
      } else if (payload.type === 'message_delete') {
        setMessages((prev) => prev.filter((m) => m.id !== payload.id));
      } else if (payload.type === 'reaction_add' || payload.type === 'reaction_remove') {
        // Dispatch event globally so individual messages sync
        window.dispatchEvent(new CustomEvent('ws_reaction_event', { detail: payload }));
      }
    };

    return () => socket.close();
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, filePreview]);

  const selectFile = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        addToast('File too large. Max allowed size is 10MB', 'danger');
        return;
      }
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const clearFileSelection = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('http://localhost:5000/api/messages/media', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!res.ok) throw new Error('Media upload failed');
        const mediaMsg = await res.json();
        setMessages((prev) => [...prev, mediaMsg]);
        clearFileSelection();
      } else if (content.trim() && ws) {
        ws.send(JSON.stringify({ token, content: content.trim(), type: 'text' }));
        setContent('');
      }
      setShowPicker(false);
    } catch (err) {
      console.error(err);
      addToast('Could not deliver message', 'danger');
    }
  };

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* WhatsApp Profile Banner */}
      <div className="d-flex justify-content-between align-items-center bg-white px-4 py-3 border-bottom shadow-sm flex-shrink-0" style={{ zIndex: 100 }}>
        <div className="d-flex align-items-center gap-3">
          <img
            src={user?.avatar ? `http://localhost:5000${user.avatar}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
            alt="profile"
            className="rounded-circle border"
            width="48"
            height="48"
            style={{ objectFit: 'cover' }}
          />
          <div>
            <h6 className="m-0 fw-bold text-dark">{user?.username}</h6>
            <div className="d-flex align-items-center gap-1">
              <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }} />
              <small className="text-success fw-medium">Active • {currentTime}</small>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-outline-danger px-3 rounded-pill btn-sm fw-medium shadow-sm">
          Logout
        </button>
      </div>

      {/* Main Messaging Window */}
      <div className="flex-grow-1 overflow-y-auto px-4 py-3 chat-window-bg">
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          {messages.map((msg) => {
            // Extract the sender ID from the message (supports sender_id, user_id, or sender._id properties)
            const msgSenderId = msg.sender_id || msg.user_id || msg.sender?.id || msg.sender?._id;

            // Safe String comparison to avoid integer vs string matching bugs
            const isMine = String(msgSenderId) === String(loggedInUserId);

            return (
              <Message
                key={msg.id}
                msg={msg}
                isMine={isMine}
                currentUserId={loggedInUserId}
                onDelete={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
                onUpdate={(id, updatedContent) =>
                  setMessages((prev) =>
                    prev.map((m) => (m.id === id ? { ...m, content: updatedContent, edited: true } : m))
                  )
                }
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Dynamic Upload Preview Bar */}
      {filePreview && (
        <div className="bg-white border-top p-3 d-flex align-items-center justify-content-between flex-shrink-0" style={{ zIndex: 90 }}>
          <div className="d-flex align-items-center gap-3">
            <img src={filePreview} alt="upload preview" className="rounded-3 border shadow-sm" style={{ height: '70px', width: '70px', objectFit: 'cover' }} />
            <div>
              <span className="fw-semibold text-dark text-truncate d-block" style={{ maxWidth: '250px' }}>{file?.name}</span>
              <small className="text-muted">Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB</small>
            </div>
          </div>
          <button className="btn btn-sm btn-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={clearFileSelection}>
            ✕
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showPicker && (
        <div className="position-absolute shadow" style={{ bottom: '70px', left: '20px', zIndex: 1000 }}>
          <EmojiPicker onEmojiClick={(emojiObj) => setContent(prev => prev + emojiObj.emoji)} width={350} height={400} />
        </div>
      )}

      {/* Modern Action Tray */}
      <div className="bg-white border-top py-3 px-4 flex-shrink-0">
        <form onSubmit={handleSend} className="mx-auto d-flex align-items-center gap-2" style={{ maxWidth: '900px' }}>
          <button
            type="button"
            className={`btn border-0 p-2 fs-5 rounded-circle ${showPicker ? 'bg-light' : ''}`}
            onClick={() => setShowPicker(!showPicker)}
          >
            😊
          </button>

          {/* Hidden File Upload Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={selectFile}
            className="d-none"
          />
          <button
            type="button"
            className="btn border-0 p-2 fs-5 rounded-circle"
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>

          <input
            type="text"
            className="form-control border-0 bg-light rounded-pill px-4 py-2 shadow-none"
            placeholder={file ? 'Click "Send" to dispatch selected media...' : 'Type a message...'}
            value={content}
            disabled={!!file}
            onChange={(e) => setContent(e.target.value)}
          />

          <button type="submit" className="btn btn-success rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '42px', height: '42px' }}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}