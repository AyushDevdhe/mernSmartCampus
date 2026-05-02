import React, { useState } from "react";

const SpamReasonModal = ({ query, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");

  const predefinedReasons = [
    "Irrelevant content - not related to campus issues",
    "Duplicate query - already raised by same student",
    "Abusive or offensive language",
    "Fake complaint - no evidence provided",
    "Spam - promotional or unrelated content",
    "Incomplete information - cannot be processed",
  ];

  const handleSubmit = async () => {
    const finalReason = selectedReason || reason;
    if (!finalReason.trim()) {
      alert("Please provide a reason for marking as spam");
      return;
    }

    setIsSubmitting(true);
    await onSubmit(finalReason);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">🚫</span>
          <h2 className="text-xl font-bold text-red-700">Mark as Spam</h2>
        </div>

        <p className="mb-4 text-gray-600">
          Are you sure you want to mark this query as spam?
        </p>

        <div className="mb-4 rounded-xl bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-700">Query:</p>
          <p className="text-sm text-gray-600">{query?.title}</p>
          <p className="mt-2 text-xs text-gray-500">
            {query?.description?.substring(0, 100)}...
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Select Reason:
          </label>
          <select
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              if (e.target.value) setReason("");
            }}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          >
            <option value="">-- Select a reason --</option>
            {predefinedReasons.map((r, i) => (
              <option key={i} value={r}>
                {r}
              </option>
            ))}
            <option value="other">Other (specify below)</option>
          </select>
        </div>

        {selectedReason === "other" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Provide Reason:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this query is spam..."
              className="h-24 w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "🚫 Mark as Spam"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpamReasonModal;
