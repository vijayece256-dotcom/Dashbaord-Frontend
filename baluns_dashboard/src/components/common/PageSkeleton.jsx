import "./PageSkeleton.css";

function SkeletonBlock({ className = "" }) {
  return <span className={`page-skeleton-block ${className}`} aria-hidden="true" />;
}

function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <div className="page-skeleton-table" aria-hidden="true">
      <div className="page-skeleton-row page-skeleton-row--head">
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonBlock key={`head-${index}`} className="page-skeleton-cell" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div className="page-skeleton-row" key={`row-${row}`}>
          {Array.from({ length: columns }, (_, column) => (
            <SkeletonBlock
              key={`cell-${row}-${column}`}
              className={`page-skeleton-cell page-skeleton-cell--${column % 3}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonStats({ count = 5 }) {
  return (
    <div className="page-skeleton-stats" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="page-skeleton-stat" key={index}>
          <SkeletonBlock className="page-skeleton-label" />
          <SkeletonBlock className="page-skeleton-number" />
          <SkeletonBlock className="page-skeleton-label page-skeleton-label--short" />
        </div>
      ))}
    </div>
  );
}

export default function PageSkeleton({ variant = "table" }) {
  const isDashboard = variant === "dashboard";
  const isProjects = variant === "projects";
  const isBoard = variant === "board";
  const isTeam = variant === "team";
  const isUsersTable = variant === "users-table";
  const isTeamList = variant === "team-list";

  return (
    <div
      className={`page-skeleton page-skeleton--${variant}`}
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
    >
      {!isUsersTable && !isTeamList && (
        <div className="page-skeleton-header" aria-hidden="true">
          <div className="page-skeleton-heading">
            <SkeletonBlock className="page-skeleton-title" />
            <SkeletonBlock className="page-skeleton-subtitle" />
          </div>
          {!isDashboard && <SkeletonBlock className="page-skeleton-action" />}
        </div>
      )}

      {(isDashboard || isProjects) && <SkeletonStats count={5} />}

      {isDashboard ? (
        <div className="page-skeleton-dashboard-grid" aria-hidden="true">
          <div className="page-skeleton-panel page-skeleton-panel--large">
            <SkeletonBlock className="page-skeleton-panel-title" />
            <SkeletonBlock className="page-skeleton-chart" />
          </div>
          <div className="page-skeleton-panel">
            <SkeletonBlock className="page-skeleton-panel-title" />
            <SkeletonBlock className="page-skeleton-chart page-skeleton-chart--short" />
          </div>
        </div>
      ) : isBoard ? (
        <div className="page-skeleton-board" aria-hidden="true">
          {Array.from({ length: 4 }, (_, column) => (
            <div className="page-skeleton-board-column" key={column}>
              <div className="page-skeleton-board-column-head">
                <SkeletonBlock className="page-skeleton-board-column-title" />
                <SkeletonBlock className="page-skeleton-board-count" />
              </div>
              {Array.from({ length: 3 }, (_, card) => (
                <div className="page-skeleton-board-card" key={card}>
                  <SkeletonBlock className="page-skeleton-board-card-line" />
                  <SkeletonBlock className="page-skeleton-board-card-line page-skeleton-board-card-line--short" />
                  <div className="page-skeleton-board-card-footer">
                    <SkeletonBlock className="page-skeleton-board-card-tag" />
                    <SkeletonBlock className="page-skeleton-board-avatar" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : isTeamList ? (
        <div className="page-skeleton-team-list" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="page-skeleton-team-card" key={index}>
              <SkeletonBlock className="page-skeleton-title page-skeleton-title--small" />
              <SkeletonBlock className="page-skeleton-subtitle" />
              <SkeletonBlock className="page-skeleton-team-line" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {!isUsersTable && (
            <div className="page-skeleton-toolbar" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-search" />
              <SkeletonBlock className="page-skeleton-filter" />
              <SkeletonBlock className="page-skeleton-filter" />
              {isProjects && <SkeletonBlock className="page-skeleton-filter" />}
            </div>
          )}
          <SkeletonTable rows={isTeam ? 7 : isUsersTable ? 5 : 7} columns={isTeam ? 6 : 5} />
        </>
      )}
    </div>
  );
}
