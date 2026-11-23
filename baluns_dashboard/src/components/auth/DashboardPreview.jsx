
import { useEffect, useRef, useState } from "react";
import {
  Layers,
  Play,
  Check,
  Pause,
  Users,
} from "lucide-react";

import StatCard from "../common/StatCard.jsx";
import DeliveryHealth from "../dashboard/DeliveryHealth.jsx";
import TeamPerformance from "../dashboard/TeamPerformance.jsx";
import HoldProjects from "../dashboard/HoldProjects.jsx";

import "./DashboardPreview.css";

const DESIGN_WIDTH = 1050;
const DESIGN_HEIGHT = 680;

// Static dummy data — never uses application context
const DEMO = {
  projectTotal: 24,
  inProgress: 12,
  completed: 8,
  employees: 48,
  teams: 5,
  projectPct: 33,
  taskPct: 76,
  overdue: 6,
  holdProjects: [
    {
      id: "demo-1",
      name: "Demo Client Portal",
      client: "Sample Client",
      owner: "Demo User A",
      holdReason: "Waiting for sample approval",
      holdSince: "2026-11-15",
      expectedResolution: "2026-11-29",
    },
    {
      id: "demo-2",
      name: "Sample Automation",
      client: "Demo Internal",
      owner: "Demo User B",
      holdReason: "Sample dependency pending",
      holdSince: "2026-11-19",
      expectedResolution: "2026-12-02",
    },
  ],
};

const DEMO_TEAMS = [
  {
    id: "demo-t1",
    name: "Demo Software",
    done: 34,
    total: 44,
    pct: 78,
  },
  {
    id: "demo-t2",
    name: "Demo Application",
    done: 42,
    total: 50,
    pct: 84,
  },
  {
    id: "demo-t3",
    name: "Demo Testing",
    done: 27,
    total: 36,
    pct: 75,
  },
  {
    id: "demo-t4",
    name: "Demo Business",
    done: 18,
    total: 25,
    pct: 72,
  },
];

export default function DashboardPreview() {
  const frameRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;

    if (!frame || !inner) return;

    inner.inert = true;

    const updateScale = () => {
      const availableWidth = frame.clientWidth;
      const availableHeight = frame.clientHeight;

      const contentHeight = Math.max(
        inner.scrollHeight,
        DESIGN_HEIGHT
      );

      const widthScale = availableWidth / DESIGN_WIDTH;
      const heightScale = availableHeight / contentHeight;

      setScale(Math.min(widthScale, heightScale, 1));
    };

    const observer = new ResizeObserver(updateScale);

    observer.observe(frame);
    observer.observe(inner);

    updateScale();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="preview-frame"
      ref={frameRef}
      aria-hidden="true"
    >
      <div
        className="preview-inner"
        ref={innerRef}
        style={{
          width: DESIGN_WIDTH,
          transform: `scale(${scale})`,
        }}
      >
        <div className="preview-stats">
          <StatCard
            icon={Layers}
            label="Total projects"
            value={DEMO.projectTotal}

          />

          <StatCard
            icon={Play}
            label="In progress"
            value={DEMO.inProgress}
          />

          <StatCard
            icon={Check}
            label="Completed"
            value={DEMO.completed}
          />


          <StatCard
            icon={Users}
            label="Total employees"
            value={DEMO.employees}
          />
        </div>

        <div className="preview-main">
          <div className="preview-left">
            <DeliveryHealth stats={DEMO} />
            <TeamPerformance teams={DEMO_TEAMS} />
          </div>

          <HoldProjects stats={DEMO} />
        </div>
      </div>
    </div>
  );
}
