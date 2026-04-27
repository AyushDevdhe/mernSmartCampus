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
        return "bg-emerald-500";
      case "assigned":
        return "bg-sky-500";
      case "progress":
        return "bg-amber-500";
      case "resolved":
        return "bg-emerald-500";
      case "admin":
        return "bg-rose-500";
      default:
        return "bg-slate-500";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="mb-4 text-base font-semibold text-slate-900">
        📅 Timeline
      </h4>

      <div className="relative pl-8">
        <div className="absolute bottom-2 left-3.5 top-2 w-0.5 bg-slate-200" />

        {timelineEvents.map((event, index) => (
          <div key={index} className="relative mb-4">
            <div
              className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_2px_#e2e8f0] ${getStatusColor(
                event.status,
              )}`}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(event.status)}</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {event.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(event.date).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryTimeline;
