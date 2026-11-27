import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import PageSkeleton from "../common/PageSkeleton.jsx";
import { MINIMUM_SKELETON_MS } from "../../utils/minimumLoadingTime.js";

function skeletonVariant(pathname) {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/projects") return "projects";
  if (pathname === "/team") return "team";
  if (pathname.startsWith("/boards/")) return "board";
  return "table";
}

export default function RouteLoadingBoundary() {
  const { pathname } = useLocation();
  const [readyPath, setReadyPath] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setReadyPath(pathname),
      MINIMUM_SKELETON_MS
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (pathname === "/") return <Navigate to="/dashboard" replace />;

  if (readyPath !== pathname) {
    return <PageSkeleton variant={skeletonVariant(pathname)} />;
  }

  return <Outlet />;
}
