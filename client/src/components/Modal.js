import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop show"
            style={{ backgroundColor: 'rgba(11, 20, 26, 0.65)', zIndex: 1050 }}
          />

          {/* Modal Container */}
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1051 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="modal-content border-0 rounded-4 shadow"
                style={{ backgroundColor: '#ffffff' }}
              >
                <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center p-4">
                  <h5 className="modal-title fw-bold text-dark">{title}</h5>
                  <button type="button" className="btn-close shadow-none" onClick={onClose} />
                </div>
                <div className="modal-body p-4 pt-3">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}