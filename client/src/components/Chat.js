import React, { useEffect, useState, useRef } from 'react';
import { getMessages } from '../services/api';
import { formatTimeAgo } from '../utils/time'; // Adjust path if needed
import Message from './Message';

  const Chat = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [ws, setWs] = useState(null);
  const bottomRef = useRef();

  const token = localStorage.getItem('token');

  useEffect(() => {
    // 1. Fetch past messages
    const fetchMessages = async () => {
      try {
        const res = await getMessages(token);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    // 2. Connect WebSocket
    const socket = new WebSocket('ws://localhost:5000');
    setWs(socket);

    socket.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    return () => socket.close();
  }, [token]);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
  
  try {
      if (file) {
      // 📤 Upload media
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);
  
        //     Send media message via API
        const res = await fetch('http://localhost:5000/api/messages/media', {
          method: 'POST',
          body: formData,
        });
  
        const mediaMsg = await res.json();
        setMessages((prev) => [...prev, mediaMsg]);
        setFile(null);
      } 
      if (content.trim()){
        ws.send(JSON.stringify({ token,content}));
      }

      setContent('');
    }
      catch (err) {
        console.error('Media upload failed:', err);
      }
  };
  

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>Welcome, {user.username}</div>
        <button onClick={onLogout} className="btn btn-outline-danger btn-sm">
          Logout
        </button>
      </div>

      <h3 className="mb-3">🟢 Chat Room</h3>

      {/* ✅ Enhanced Chat Container */}
      <div className="chat-container mb-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;
          const timestamp = formatTimeAgo(msg.created_at);

          switch (msg.type) {
            case 'media':
            console.log('Rendering media message:', msg); // 👈 ADD THIS LINE
              return (
                <div key={msg.id} className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`media-bubble p-2 rounded ${isMine ? 'bg-primary text-white' : 'bg-light text-dark'}`}>
                    <img
                      src={`http://localhost:5000${msg.content}`}// Important full path
                      alt="sent-media"
                           style={{ maxWidth: '200px',   // limit width
                        maxHeight: '300px',  // limit height
                        width: '100%',       // scale to fit container if smaller
                        height: 'auto',      // preserve aspect ratio
                        borderRadius: '5px' }}
                    />
                    <div className="text-muted small text-end">{timestamp}</div>
                  </div>
                </div>
              );

            case 'reaction':
              return (
                <div key={msg.id} className="d-flex justify-content-center mb-2">
                  <span className="reaction-bubble">{msg.content}</span>
                </div>
              );

            case 'system':
              return (
                <div key={msg.id} className="text-center text-muted small mb-2">
                  — {msg.content} —
                </div>
              );

           
  
                default:
                return (
                  <Message
                   key={msg.id} 
                   msg={msg}
                   isMine={isMine} 
                   onDelete={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
                   />
                );
              
                 
             
          }
        })}
        <div ref={bottomRef}></div>
      </div>

      <form onSubmit={handleSend} className="d-flex flex-column gap-2">
  <div className="d-flex">
    <input
      className="form-control me-2"
      placeholder="Type a message..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
    <input
      type="file"
      accept="image/*"
      onChange={(e) =>{
        console.log('Selected file:', e.target.files[0]);
         setFile(e.target.files[0])
        }}
      className="form-control-file"
    />
    {file && (
  <div className="text-muted small mb-2">
    Selected file: {file.name}
  </div>
)}

    <button className="btn btn-primary ms-2">Send</button>
  </div>
</form>

    </div>
  );
};

export default Chat;
