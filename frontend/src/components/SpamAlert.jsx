import React from "react";

const SpamAlert = ({ spamDetails, onClose }) => {
  if (!spamDetails) return null;

  const getScoreColor = (score) => {
    if (score >= 50) return "#dc2626";
    if (score >= 25) return "#eab308";
    return "#22c55e";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">🚫</span>
          <h2 className="text-xl font-bold text-rose-700">Query Blocked</h2>
        </div>

        <p className="mb-4 text-gray-600">
          Your query was flagged by our AI spam detection system.
        </p>

        <div className="mb-4 rounded-xl bg-rose-50 p-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-semibold text-rose-700">
              Spam Score:
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: getScoreColor(spamDetails.score) }}
            >
              {spamDetails.score}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${spamDetails.score}%`,
                backgroundColor: getScoreColor(spamDetails.score),
              }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Reasons:</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {spamDetails.reasons?.slice(0, 4).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default SpamAlert;
