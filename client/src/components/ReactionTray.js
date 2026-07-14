import React from 'react';

const REACTION_PRESETS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

export default function ReactionTray({ onSelect, onOpenFullPicker }) {
  return (
    <div className="d-flex align-items-center gap-1 bg-white p-1 rounded-pill shadow border" style={{ width: 'fit-content' }}>
      {REACTION_PRESETS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="btn btn-sm border-0 p-1 fs-5 rounded-circle hover-scale"
          style={{ transition: 'transform 0.1s ease', width: '32px', height: '32px' }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-sm border-0 p-1 rounded-circle bg-light d-flex align-items-center justify-content-center"
        style={{ width: '32px', height: '32px' }}
        onClick={onOpenFullPicker}
      >
        ➕
      </button>
    </div>
  );
}