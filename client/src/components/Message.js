import React, { useState, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { formatTimeAgo } from '../utils/time';
import Modal from './Modal';
import ReactionTray from './ReactionTray';

export default function Message({ msg, isMine, onDelete, onUpdate, currentUserId }) {
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editVal, setEditVal] = useState(msg.content);

  useEffect(() => {
    fetch(`http://localhost:5000/api/reactions/${msg.id}`)
      .then((res) => res.json())
      .then(setReactions)
      .catch(console.error);
  }, [msg.id]);

  useEffect(() => {
    const handleReactionEvent = (e) => {
      const { detail } = e;
      if (detail.message_id !== msg.id) return;

      if (detail.type === 'reaction_add') {
        setReactions(prev => {
          const alreadyExists = prev.some(r => r.user_id === detail.user_id && r.emoji === detail.emoji);
          if (alreadyExists) return prev;
          return [...prev, { user_id: detail.user_id, emoji: detail.emoji }];
        });
      } else if (detail.type === 'reaction_remove') {
        setReactions(prev => prev.filter(r => !(r.user_id === detail.user_id && r.emoji === detail.emoji)));
      }
    };

    window.addEventListener('ws_reaction_event', handleReactionEvent);
    return () => window.removeEventListener('ws_reaction_event', handleReactionEvent);
  }, [msg.id]);

  const handleReactionSelect = async (emojiString) => {
    const token = localStorage.getItem('token');
    setShowEmojiTray(false);
    setShowPicker(false);

    try {
      const response = await fetch('http://localhost:5000/api/reactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message_id: msg.id, emoji: emojiString }),
      });
      const data = await response.json();
      if (data.action === 'added') {
        setReactions(prev => [...prev, { emoji: emojiString, user_id: currentUserId }]);
      } else {
        setReactions(prev => prev.filter(r => !(r.user_id === currentUserId && r.emoji === emojiString)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeEdit = async () => {
    if (!editVal.trim() || editVal.trim() === msg.content) {
      setIsEditModalOpen(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${msg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: editVal.trim() }),
      });

      if (response.ok) {
        onUpdate(msg.id, editVal.trim());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditModalOpen(false);
    }
  };

  const executeDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${msg.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onDelete(msg.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const reactionGroups = reactions.reduce((acc, current) => {
    acc[current.emoji] = (acc[current.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* Tightened mb-2 spacing mimics WhatsApp's cohesive look */}
      <div className={`d-flex mb-2 w-100 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
        
        {/* Keeps avatar on the appropriate side of the bubble */}
        <div 
          className="d-flex align-items-start gap-2 message-wrapper" 
          style={{ maxWidth: '80%', flexDirection: isMine ? 'row-reverse' : 'row' }}
        >
          {/* Avatar rendering remains active */}
          <img
            src={msg.avatar ? `http://localhost:5000${msg.avatar}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
            alt="avatar"
            className="rounded-circle shadow-sm flex-shrink-0"
            width="32"
            height="32"
            style={{ objectFit: 'cover', marginTop: '2px' }}
          />

          <div className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}>
            
            {/* Action buttons (hover) */}
            <div 
              className={`message-actions-trigger position-absolute top-0 d-flex gap-1 ${
                isMine ? 'start-0 translate-x-n100 ps-4' : 'end-0 translate-x-100 pe-4'
              }`} 
              style={{ zIndex: 10 }}
            >
              <button
                type="button"
                className="btn btn-sm btn-light border shadow-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}
                onClick={() => setShowEmojiTray(!showEmojiTray)}
              >
                😀
              </button>
              {isMine && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border shadow-sm rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setEditVal(msg.content);
                      setIsEditModalOpen(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border shadow-sm rounded-circle d-flex align-items-center justify-content-center text-danger"
                    style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>

            {/* Reaction tray rendering block */}
            {showEmojiTray && (
              <div className="position-absolute z-3 top-n100">
                <ReactionTray
                  onSelect={handleReactionSelect}
                  onOpenFullPicker={() => setShowPicker(!showPicker)}
                />
              </div>
            )}

            {/* Main Styled Chat Bubble */}
            <div className={`message-bubble shadow-sm ${isMine ? 'mine' : 'other'}`}>
              
              {/* Other sender names highlighted inside the bubble */}
              {!isMine && (
                <div className="fw-bold text-success" style={{ fontSize: '0.78rem', marginBottom: '2px' }}>
                  {msg.username}
                </div>
              )}

              {msg.type === 'media' ? (
                <div className="position-relative">
                  <img
                    src={`http://localhost:5000${msg.content}`}
                    alt="uploaded media"
                    onClick={() => setIsZoomed(true)}
                    className="img-fluid rounded-2 mb-1"
                    style={{ cursor: 'pointer', maxHeight: '180px', objectFit: 'cover' }}
                  />
                  {isZoomed && (
                    <div
                      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-75"
                      style={{ zIndex: 9999, cursor: 'zoom-out' }}
                      onClick={() => setIsZoomed(false)}
                    >
                      <img
                        src={`http://localhost:5000${msg.content}`}
                        alt="zoomed media"
                        className="img-fluid"
                        style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                      />
                    </div>
                  )}
                  {/* Inline metadata under images */}
                  <div className="d-flex align-items-center justify-content-end gap-1 text-uppercase text-muted mt-1" style={{ fontSize: '0.62rem' }}>
                    {msg.edited && <span className="fst-italic me-1">(edited)</span>}
                    <span>{formatTimeAgo(msg.created_at)}</span>
                  </div>
                </div>
              ) : (
                /* Text and timestamp structured cleanly in a flowing row */
                <div className="message-content-container">
                  <span className="message-text text-start" style={{ whiteSpace: 'pre-line' }}>
                    {msg.content}
                  </span>
                  <span className="message-meta d-flex align-items-center">
                    {msg.edited && <span className="fst-italic me-1">(edited)</span>}
                    {formatTimeAgo(msg.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Reactions aggregation pills */}
            {Object.keys(reactionGroups).length > 0 && (
              <div className={`reaction-pills-wrap d-flex gap-1 ${isMine ? 'me-2' : 'ms-2'}`}>
                {Object.entries(reactionGroups).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    className="reaction-pill d-flex align-items-center gap-1"
                    onClick={() => handleReactionSelect(emoji)}
                  >
                    <span>{emoji}</span>
                    <span className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}>{count}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Emoji Picker positioning */}
            {showPicker && (
              <div className="position-absolute z-3 shadow mt-1">
                <div className="position-fixed" style={{ zIndex: 9999 }}>
                  <EmojiPicker
                    onEmojiClick={(emojiObj) => handleReactionSelect(emojiObj.emoji)}
                    height={320}
                    width={280}
                  />
                  <div className="text-end bg-white border-top p-1">
                    <button type="button" className="btn btn-sm btn-secondary py-0" onClick={() => setShowPicker(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Message">
        <textarea
          className="form-control mb-3"
          rows="3"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
        />
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
          <button className="btn btn-success btn-sm" onClick={executeEdit}>Save Changes</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Message?">
        <p className="text-muted small">Are you sure you want to delete this message? This action cannot be undone.</p>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={executeDelete}>Delete Forever</button>
        </div>
      </Modal>
    </>
  );
}