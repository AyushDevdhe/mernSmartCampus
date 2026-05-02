import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSimilarQueries } from "../services/SimilarityApis";
import "../css/SimilarQueriesModal.css";

const SimilarQueriesModal = ({
  queryId,
  queryTitle,
  onClose,
  onBatchResolve,
}) => {
  const navigate = useNavigate();
  const [similarResolved, setSimilarResolved] = useState([]);
  const [similarUnresolved, setSimilarUnresolved] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreshold, setSelectedThreshold] = useState(0.4);
  const [targetQuery, setTargetQuery] = useState(null);

  useEffect(() => {
    fetchSimilarQueries();
  }, [selectedThreshold]);

  const fetchSimilarQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getSimilarQueries(queryId, selectedThreshold);
      if (res?.data?.success) {
        setSimilarResolved(res.data.similarResolved || []);
        setSimilarUnresolved(res.data.similarUnresolved || []);
        setTargetQuery(res.data.targetQuery);
      }
    } catch (error) {
      console.error("Error fetching similar queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 70) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#f97316";
  };

  const handleViewQuery = (id) => {
    navigate(`/query/${id}`);
    onClose(); // Close modal after navigation
  };

  return (
    <div className="similar-modal-overlay" onClick={onClose}>
      <div
        className="similar-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="similar-modal-header">
          <h2>🔍 Find Similar Queries</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="similar-modal-body">
          {/* Target Query Info */}
          {targetQuery && (
            <div className="target-query-box">
              <h4>Current Query:</h4>
              <p>
                <strong>{targetQuery.title}</strong>
              </p>
              <p className="target-desc">
                {targetQuery.description?.substring(0, 100)}...
              </p>
            </div>
          )}

          {/* Threshold Slider */}
          <div className="threshold-control">
            <label>Similarity Threshold: {selectedThreshold * 100}%</label>
            <input
              type="range"
              min="0.3"
              max="0.8"
              step="0.05"
              value={selectedThreshold}
              onChange={(e) => setSelectedThreshold(parseFloat(e.target.value))}
            />
            <p className="threshold-hint">Higher = more precise matches</p>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="similar-loading">
              <div className="spinner"></div>
              <p>Analyzing with AI...</p>
            </div>
          ) : (
            <>
              {/* UNRESOLVED SECTION - Can batch resolve */}
              {similarUnresolved.length > 0 && (
                <div className="similar-results">
                  <h3>
                    🔄 Similar Unresolved Queries ({similarUnresolved.length})
                  </h3>
                  <p className="section-hint">
                    These can be batch resolved together
                  </p>
                  {similarUnresolved.map((query) => (
                    <div
                      key={query._id}
                      className="similar-query-card unresolved"
                    >
                      <div
                        className="similarity-badge"
                        style={{
                          background: getSimilarityColor(query.similarity),
                        }}
                      >
                        {query.similarity}% Match
                      </div>
                      <div className="similar-query-content">
                        <h4>{query.title}</h4>
                        <p className="similar-desc">
                          {query.description?.substring(0, 120)}...
                        </p>
                        <div className="similar-meta">
                          <span
                            className={`priority-badge priority-${query.priority?.toLowerCase()}`}
                          >
                            {query.priority}
                          </span>
                          <span>Status: {query.status}</span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-view"
                            onClick={() => handleViewQuery(query._id)}
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RESOLVED SECTION - Stats only, no batch resolve */}
              {similarResolved.length > 0 && (
                <div className="similar-results">
                  <h3>
                    ✅ Similar Resolved Queries ({similarResolved.length})
                  </h3>
                  <p className="section-hint">Historical data for reference</p>
                  {similarResolved.map((query) => (
                    <div
                      key={query._id}
                      className="similar-query-card resolved"
                    >
                      <div
                        className="similarity-badge"
                        style={{
                          background: getSimilarityColor(query.similarity),
                        }}
                      >
                        {query.similarity}% Match
                      </div>
                      <div className="similar-query-content">
                        <h4>{query.title}</h4>
                        <p className="similar-desc">
                          {query.description?.substring(0, 120)}...
                        </p>
                        <div className="similar-meta">
                          <span
                            className={`priority-badge priority-${query.priority?.toLowerCase()}`}
                          >
                            {query.priority}
                          </span>
                          <span>Resolved by: {query.resolvedBy}</span>
                          <span>
                            on:{" "}
                            {new Date(
                              query.resolutionDate,
                            ).toLocaleDateString()}
                          </span>
                          <span>
                            ⏱️ Resolution: {query.resolutionTime || "~2.5 days"}
                          </span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-view"
                            onClick={() => handleViewQuery(query._id)}
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {similarResolved.length === 0 &&
                similarUnresolved.length === 0 && (
                  <div className="no-results">
                    <span>🔍</span>
                    <p>No similar queries found.</p>
                    <p className="hint">
                      Try lowering the similarity threshold
                    </p>
                  </div>
                )}
            </>
          )}
        </div>

        <div className="similar-modal-footer">
          {similarUnresolved.length > 0 && (
            <button
              className="btn-batch-resolve"
              onClick={() => {
                const confirmed = window.confirm(
                  `Are you sure you want to resolve ALL ${similarUnresolved.length} similar unresolved queries?`,
                );
                if (confirmed) {
                  onBatchResolve(similarUnresolved.map((q) => q._id));
                }
              }}
            >
              ✅ Batch Resolve Unresolved ({similarUnresolved.length})
            </button>
          )}
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarQueriesModal;
