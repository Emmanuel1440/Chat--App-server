import React, { useEffect, useState,  } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { formatTimeAgo } from '../utils/time';
import * as bootstrap from 'bootstrap';

export default function Message({ msg, isMine, onDelete }) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  //const toastRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/reactions/${msg.id}`)
      .then((res) => res.json())
      .then(setReactions)
      .catch(console.error);
  }, [msg.id]);

  const showToast = (text, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3`;
    toast.role = 'alert';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${text}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 2000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  };

  const handleEmojiClick = async (emojiObject) => {
    const token = localStorage.getItem('token');

    await fetch('http://localhost:5000/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        message_id: msg.id,
        emoji: emojiObject.emoji,
      }),
    });

    setReactions((prev) => [...prev, { emoji: emojiObject.emoji }]);
    setShowPicker(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    await fetch(`http://localhost:5000/api/messages/${msg.id}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json' ,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
 
    });

    onDelete?.(msg.id);
    showToast('Message deleted');
  };

  const handleEdit = async () => {
    const newContent = prompt('Edit your message:', msg.content);
    if (!newContent || newContent.trim() === msg.content) return;

    const response = await fetch(`http://localhost:5000/api/messages/${msg.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({  content: newContent.trim() }),
    });

    if (response.ok) {
      const updated = await response.json();
      msg.content = updated.content;
      msg.edited = true;
      showToast('Message updated');
    } else {
      showToast('Failed to update', 'danger');
    }
  };

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
  };

  return (
    <div className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
      <div
        className={`p-2 rounded ${isMine ? 'bg-primary text-white' : 'bg-light text-dark'}`}
        style={{ maxWidth: '70%' }}
      >
        <div className="d-flex align-items-start gap-2">
          {!isMine && (
            <img
              src={msg.avatar ? `http://localhost:5000${msg.avatar}` : '/default-avatar.png'}
              alt="avatar"
              className="rounded-circle"
              width="32"
              height="32"
            />
          )}

          <div>
            {!isMine && <strong>{msg.username}</strong>}

            {msg.type === 'media' ? (
              <img
                src={`http://localhost:5000${msg.content}`}
                alt="uploaded"
                onDoubleClick={toggleZoom}
                style={{
                  maxWidth: isZoomed ? '500px' : '150px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: '0.3s ease',
                }}
                className="mb-2"
              />
            ) : (
              <p className="mb-1">
                {msg.content}
                {msg.edited && <span className="ms-2 text-muted" style={{ fontSize: '0.75rem' }}>(edited)</span>}
              </p>
            )}

            {/* Reactions */}
            <div>
              {reactions.map((r, i) => (
                <span key={`${r.emoji}-${i}`} className="me-1">
                  {r.emoji}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => setShowPicker((prev) => !prev)}
              >
                😀
              </button>

              {isMine && (
                <>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleEdit}>
                    ✏️
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={handleDelete}>
                    🗑️
                  </button>
                </>
              )}
            </div>

            {/* Emoji Picker */}
            {showPicker && (
              <div className="mt-2">
                <EmojiPicker onEmojiClick={handleEmojiClick} height={300} />
              </div>
            )}

            {/* Timestamp */}
            <div className="text-muted small text-end mt-2">
              {formatTimeAgo(msg.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
