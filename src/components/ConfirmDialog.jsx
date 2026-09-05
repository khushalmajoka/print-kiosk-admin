import "./ConfirmDialog.css";

/**
 * ConfirmDialog.jsx
 *
 * Replaces window.confirm() for destructive/irreversible actions (like
 * rotating a shop's agent key). window.confirm() is a native browser
 * dialog that looks completely out of place next to a designed UI, and
 * can't be styled at all — this gives the same "are you sure?" gate with
 * a proper on-brand modal instead.
 *
 * Controlled component: render it conditionally based on state in the
 * parent (e.g. `{pendingConfirm && <ConfirmDialog ... />}`), and clear
 * that state in onConfirm/onCancel.
 */
export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="confirm-confirm-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
