const QueryTimeline = ({ query, createdAt, updatedAt, statusHistory }) => {
  // Create timeline events based on query data
  const getTimelineEvents = () => {
    const events = [];

    // Event 1: Query Created
    events.push({
      date: new Date(query.createdAt),
      title: "Query Created",
      description: `Query "${query.title}" was created by ${query.user?.firstName} ${query.user?.lastName}`,
      status: "created",
    });

    // Event 2: Assigned to Supervisor
    if (query.assignedTo) {
      events.push({
        date: new Date(query.updatedAt),
        title: "Assigned to Supervisor",
        description: `Assigned to ${query.assignedTo?.firstName} ${query.assignedTo?.lastName}`,
        status: "assigned",
      });
    }

    // Event 3: Status changes
    if (query.status === "In Progress") {
      events.push({
        date: new Date(query.updatedAt),
        title: "Status Updated",
        description: "Query status changed to In Progress",
        status: "progress",
      });
    }

    // Event 4: Resolved
    if (query.status === "Resolved") {
      events.push({
        date: new Date(query.updatedAt),
        title: "Query Resolved",
        description: "Query has been marked as Resolved",
        status: "resolved",
      });
    }

    // Event 5: Admin Action
    if (query.adminAction && query.adminAction !== "none") {
      events.push({
        date: new Date(query.actionTakenAt || query.updatedAt),
        title: "Admin Action Taken",
        description:
          query.adminActionMessage || `Admin issued a ${query.adminAction}`,
        status: "admin",
      });
    }

    // Sort by date (oldest first)
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const timelineEvents = getTimelineEvents();

  const getStatusColor = (status) => {
    switch (status) {
      case "created":
        return "#22c55e";
      case "assigned":
        return "#3b82f6";
      case "progress":
        return "#eab308";
      case "resolved":
        return "#22c55e";
      case "admin":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "created":
        return "📝";
      case "assigned":
        return "👤";
      case "progress":
        return "⚙️";
      case "resolved":
        return "✅";
      case "admin":
        return "👑";
      default:
        return "📌";
    }
  };

  return (
    <div className="query-timeline" style={{ marginTop: "20px" }}>
      <h4
        style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "bold" }}
      >
        📅 Timeline
      </h4>

      <div
        className="timeline-container"
        style={{ position: "relative", paddingLeft: "30px" }}
      >
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: "15px",
            top: "10px",
            bottom: "10px",
            width: "2px",
            background: "#e2e8f0",
          }}
        />

        {timelineEvents.map((event, index) => (
          <div
            key={index}
            style={{ position: "relative", marginBottom: "24px" }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: "-26px",
                top: "0",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: getStatusColor(event.status),
                border: "2px solid white",
                boxShadow: "0 0 0 2px #e2e8f0",
              }}
            />

            {/* Content */}
            <div
              style={{
                background: "#f8fafc",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {getStatusIcon(event.status)}
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {event.title}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {new Date(event.date).toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryTimeline;
