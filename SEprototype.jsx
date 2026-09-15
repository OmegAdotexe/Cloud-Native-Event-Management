import React, { useState, useRef, useEffect } from "react";
import {
  CalendarClock,
  Users,
  MessageCircle,
  Mail,
  Globe,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ChevronRight,
  MapPin,
  Radio,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PEOPLE = [
  "Aarav Mehta", "Priya Nair", "Karan Shah", "Ishita Verma", "Rohan Gupta",
  "Ananya Iyer", "Vikram Rao", "Sneha Kulkarni", "Aditya Bose", "Meera Pillai",
  "Yash Kapoor", "Diya Kulkarni",
];

const initialEvents = [
  {
    id: "ev1",
    name: "Robotics Workshop",
    venue: "Lab 204, Engineering Block",
    schedule: "Sept 20, 10:00 AM",
    capacity: 40,
    registered: PEOPLE.slice(0, 6),
    status: "Published",
  },
  {
    id: "ev2",
    name: "Cultural Night",
    venue: "Open Air Theatre",
    schedule: "Sept 22, 6:00 PM",
    capacity: 300,
    registered: PEOPLE.slice(0, 9),
    status: "Published",
  },
  {
    id: "ev3",
    name: "Hackathon Kickoff",
    venue: "Innovation Hub, Room A",
    schedule: "Sept 25, 9:00 AM",
    capacity: 60,
    registered: PEOPLE.slice(2, 8),
    status: "Published",
  },
  {
    id: "ev4",
    name: "Guest Lecture: AI Systems",
    venue: "Auditorium B",
    schedule: "Sept 28, 2:00 PM",
    capacity: 150,
    registered: PEOPLE.slice(1, 5),
    status: "Published",
  },
];

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "email", label: "Email", icon: Mail },
  { key: "web", label: "Web / In-app", icon: Globe },
];

const FOCUS_PARTICIPANT = "Priya Nair";

let uid = 1;
const nextId = () => `n${uid++}`;

function nowStamp() {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", { hour12: false });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.relay-root {
  --ink: #0D1321;
  --panel: #141B2E;
  --panel-2: #1B2440;
  --line: #262F4A;
  --paper: #E9E7DF;
  --mute: #8A93AC;
  --amber: #F2A93C;
  --teal: #4FB8A6;
  --coral: #E2604F;
  font-family: 'Inter', sans-serif;
  background: var(--ink);
  color: var(--paper);
  min-height: 100%;
  width: 100%;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
}
.relay-root * { box-sizing: border-box; }
.relay-mono { font-family: 'IBM Plex Mono', monospace; }
.relay-display { font-family: 'Space Grotesk', sans-serif; }

.relay-side {
  width: 210px;
  flex-shrink: 0;
  background: var(--panel);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  gap: 22px;
}
.relay-logo { display: flex; align-items: center; gap: 8px; padding: 0 6px; }
.relay-logo-mark {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(135deg, var(--amber), var(--coral));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.relay-logo-text { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.relay-logo-sub { font-size: 10.5px; color: var(--mute); margin-top: -2px; }

.relay-roles { display: flex; flex-direction: column; gap: 4px; }
.relay-role-label { font-size: 10.5px; color: var(--mute); padding: 0 6px 2px; text-transform: lowercase; }
.relay-role-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer;
  font-size: 13px; color: var(--mute); border: 1px solid transparent;
  transition: background .15s, color .15s;
  background: none;
}
.relay-role-btn:hover { background: var(--panel-2); color: var(--paper); }
.relay-role-btn.active {
  background: var(--panel-2);
  color: var(--paper);
  border-color: var(--line);
}
.relay-role-btn.active .relay-role-dot { background: var(--amber); }
.relay-role-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--line); flex-shrink: 0; }

.relay-nav { display: flex; flex-direction: column; gap: 2px; margin-top: auto; }
.relay-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px; border-radius: 8px; font-size: 12.5px; color: var(--mute);
}
.relay-nav-item.active { color: var(--paper); background: var(--panel-2); }

.relay-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.relay-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 22px; border-bottom: 1px solid var(--line);
}
.relay-topbar h1 { font-size: 16px; font-weight: 600; margin: 0; }
.relay-topbar p { font-size: 12px; color: var(--mute); margin: 2px 0 0; }
.relay-body { flex: 1; overflow: auto; padding: 20px 22px; }

.relay-grid { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; }

.relay-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
}
.relay-event-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 13px 14px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: border-color .15s, background .15s;
}
.relay-event-card:hover { border-color: #3A466B; }
.relay-event-card.active { border-color: var(--amber); background: var(--panel-2); }
.relay-event-name { font-size: 13.5px; font-weight: 600; }
.relay-event-meta { display: flex; gap: 14px; margin-top: 6px; flex-wrap: wrap; }
.relay-meta-item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mute); }

.relay-field-label { font-size: 10.5px; color: var(--mute); margin-bottom: 5px; display: block; }
.relay-input {
  width: 100%; background: var(--ink); border: 1px solid var(--line); border-radius: 7px;
  padding: 8px 10px; color: var(--paper); font-size: 13px; font-family: inherit;
}
.relay-input:focus { outline: none; border-color: var(--amber); }

.relay-btn {
  background: var(--amber); color: #1A1206; border: none; border-radius: 7px;
  padding: 9px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: opacity .15s;
}
.relay-btn:disabled { opacity: .45; cursor: not-allowed; }
.relay-btn-ghost {
  background: transparent; color: var(--paper); border: 1px solid var(--line); border-radius: 7px;
  padding: 8px 12px; font-size: 12.5px; cursor: pointer;
}

.relay-feed-title { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; margin-bottom: 10px; }
.relay-feed-list { display: flex; flex-direction: column; gap: 9px; max-height: 240px; overflow: auto; padding-right: 2px; }
.relay-feed-row { display: flex; gap: 9px; font-size: 12px; }
.relay-feed-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.relay-feed-text { color: var(--paper); line-height: 1.4; }
.relay-feed-ts { color: var(--mute); font-size: 10.5px; margin-top: 1px; }

.relay-trace-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
.relay-trace-label { width: 150px; font-size: 10.5px; color: var(--mute); flex-shrink: 0; }
.relay-trace-track { flex: 1; height: 6px; background: var(--ink); border-radius: 4px; overflow: hidden; }
.relay-trace-bar { height: 100%; border-radius: 4px; transition: width .5s ease; }
.relay-trace-ms { width: 40px; text-align: right; font-size: 10.5px; color: var(--mute); flex-shrink: 0; }

.relay-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10.5px; padding: 2px 7px; border-radius: 20px; font-weight: 500;
}

.relay-notif-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--line);
}
.relay-notif-row:last-child { border-bottom: none; }
.relay-notif-icon { width: 28px; height: 28px; border-radius: 7px; background: var(--panel-2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.relay-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.relay-stat-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
.relay-stat-num { font-size: 24px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.relay-stat-label { font-size: 11px; color: var(--mute); margin-top: 3px; }

.relay-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.relay-bar-label { width: 90px; font-size: 12px; color: var(--mute); display: flex; align-items: center; gap: 6px; }
.relay-bar-track { flex: 1; height: 10px; background: var(--ink); border-radius: 5px; overflow: hidden; }
.relay-bar-fill { height: 100%; border-radius: 5px; }
.relay-bar-val { width: 30px; text-align: right; font-size: 12px; font-family: 'IBM Plex Mono', monospace; }

.relay-scroll::-webkit-scrollbar { width: 6px; }
.relay-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

.relay-empty { color: var(--mute); font-size: 12.5px; padding: 20px 0; text-align: center; }
`;

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatusPill({ status }) {
  const map = {
    Sent: { color: "var(--teal)", bg: "rgba(79,184,166,0.15)", icon: CheckCircle2 },
    Retrying: { color: "var(--amber)", bg: "rgba(242,169,60,0.15)", icon: RefreshCw },
    Failed: { color: "var(--coral)", bg: "rgba(226,96,79,0.15)", icon: XCircle },
    Queued: { color: "var(--mute)", bg: "rgba(138,147,172,0.15)", icon: Clock },
  };
  const m = map[status] || map.Queued;
  const Icon = m.icon;
  return (
    <span className="relay-pill" style={{ color: m.color, background: m.bg }}>
      <Icon size={11} /> {status}
    </span>
  );
}

function ChannelIcon({ channel, size = 12 }) {
  const found = CHANNELS.find((c) => c.key === channel);
  const Icon = found ? found.icon : Globe;
  return <Icon size={size} />;
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export default function RelayPrototype() {
  const [role, setRole] = useState("admin"); // admin | participant | superadmin
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(initialEvents[0].id);
  const [draftVenue, setDraftVenue] = useState(initialEvents[0].venue);
  const [draftSchedule, setDraftSchedule] = useState(initialEvents[0].schedule);
  const [feed, setFeed] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [trace, setTrace] = useState([]);
  const [running, setRunning] = useState(false);
  const timeouts = useRef([]);

  const selected = events.find((e) => e.id === selectedId);

  useEffect(() => {
    if (selected) {
      setDraftVenue(selected.venue);
      setDraftSchedule(selected.schedule);
    }
  }, [selectedId]); // eslint-disable-line

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  function pushFeed(text, level = "info") {
    setFeed((f) => [
      { id: nextId(), text, level, ts: nowStamp() },
      ...f,
    ].slice(0, 40));
  }

  function schedule(fn, delay) {
    const t = setTimeout(fn, delay);
    timeouts.current.push(t);
  }

  function triggerChange(field) {
    if (!selected || running) return;
    const changed =
      field === "venue" ? draftVenue !== selected.venue : draftSchedule !== selected.schedule;
    if (!changed) return;

    setRunning(true);
    setTrace([]);

    const eventType = field === "venue" ? "VenueChanged" : "ScheduleChanged";
    const affected = selected.registered;

    // apply the change to underlying data immediately (source of truth)
    setEvents((evs) =>
      evs.map((e) =>
        e.id === selected.id
          ? { ...e, venue: field === "venue" ? draftVenue : e.venue, schedule: field === "schedule" ? draftSchedule : e.schedule }
          : e
      )
    );

    pushFeed(`${eventType} emitted for "${selected.name}"`, "amber");

    schedule(() => {
      pushFeed(`Resolved ${affected.length} affected participant${affected.length === 1 ? "" : "s"} (registered users only, not the full org)`, "info");
      setTrace((t) => [...t, { name: "Resolve affected participants (DB)", ms: 42 }]);
    }, 500);

    schedule(() => {
      pushFeed(`Notification event published → SQS notify-queue`, "info");
      setTrace((t) => [...t, { name: "Publish to SQS", ms: 15 }]);
    }, 1100);

    schedule(() => {
      pushFeed(`Notification Worker consumed message, dispatching to ${affected.length} recipients across WhatsApp / Email / Web`, "info");
      setTrace((t) => [...t, { name: "Notification Worker consume", ms: 20 }]);
    }, 1700);

    // dispatch per participant, per channel
    let cursor = 2200;
    affected.forEach((person, i) => {
      const channelsForPerson = i % 3 === 0 ? ["whatsapp", "email"] : i % 3 === 1 ? ["whatsapp", "web"] : ["email", "web"];
      channelsForPerson.forEach((ch) => {
        const willFailFirst = (i + ch.length) % 5 === 0; // deterministic-ish variety
        const id = nextId();
        cursor += 140;
        const delaySend = cursor;

        schedule(() => {
          setNotifications((n) => [
            {
              id,
              eventId: selected.id,
              eventName: selected.name,
              type: eventType,
              person,
              channel: ch,
              status: "Queued",
              detail:
                field === "venue"
                  ? `New venue: ${draftVenue}`
                  : `New time: ${draftSchedule}`,
              ts: nowStamp(),
            },
            ...n,
          ].slice(0, 60));
        }, delaySend);

        schedule(() => {
          setNotifications((n) =>
            n.map((row) =>
              row.id === id ? { ...row, status: willFailFirst ? "Retrying" : "Sent" } : row
            )
          );
          if (willFailFirst) {
            pushFeed(`Delivery to ${person} via ${ch} failed — retry scheduled`, "coral");
          }
        }, delaySend + 320);

        if (willFailFirst) {
          schedule(() => {
            setNotifications((n) =>
              n.map((row) => (row.id === id ? { ...row, status: "Sent" } : row))
            );
            pushFeed(`Retry succeeded: ${person} notified via ${ch}`, "teal");
          }, delaySend + 900);
        }
      });
    });

    const finalDelay = cursor + 1200;
    schedule(() => {
      setTrace((t) => [...t, { name: "Channel dispatch (WhatsApp / Email / Web)", ms: 110 }]);
      pushFeed(`Delivery cycle complete for "${selected.name}"`, "teal");
      setRunning(false);
    }, finalDelay);
  }

  return (
    <div className="relay-root relay-scroll" style={{ height: "720px" }}>
      <style>{CSS}</style>

      {/* Sidebar */}
      <div className="relay-side">
        <div className="relay-logo">
          <div className="relay-logo-mark">
            <Radio size={14} color="#1A1206" />
          </div>
          <div>
            <div className="relay-logo-text relay-display">Relay</div>
            <div className="relay-logo-sub">campus event ops</div>
          </div>
        </div>

        <div className="relay-roles">
          <div className="relay-role-label">view as</div>
          {[
            { key: "superadmin", label: "Super Admin", icon: ShieldCheck },
            { key: "admin", label: "Event Admin", icon: CalendarClock },
            { key: "participant", label: "Participant", icon: Users },
          ].map((r) => (
            <button
              key={r.key}
              className={`relay-role-btn ${role === r.key ? "active" : ""}`}
              onClick={() => setRole(r.key)}
            >
              <span className="relay-role-dot" />
              <r.icon size={14} />
              {r.label}
            </button>
          ))}
        </div>

        <div className="relay-nav">
          <div className="relay-nav-item active">
            <LayoutDashboard size={13} />
            {role === "superadmin" ? "Operations overview" : role === "admin" ? "Events" : "My events"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relay-main">
        {role === "admin" && (
          <AdminView
            events={events}
            selected={selected}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            draftVenue={draftVenue}
            draftSchedule={draftSchedule}
            setDraftVenue={setDraftVenue}
            setDraftSchedule={setDraftSchedule}
            triggerChange={triggerChange}
            running={running}
            feed={feed}
            trace={trace}
          />
        )}
        {role === "participant" && (
          <ParticipantView events={events} notifications={notifications} />
        )}
        {role === "superadmin" && (
          <SuperAdminView events={events} notifications={notifications} feed={feed} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Admin view
// ---------------------------------------------------------------------------

function AdminView({
  events, selected, selectedId, setSelectedId,
  draftVenue, draftSchedule, setDraftVenue, setDraftSchedule,
  triggerChange, running, feed, trace,
}) {
  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1>Events</h1>
          <p>Change a venue or schedule to see who gets notified — and how.</p>
        </div>
      </div>
      <div className="relay-body">
        <div className="relay-grid">
          {/* left: event list + editor */}
          <div>
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`relay-event-card ${ev.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(ev.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="relay-event-name">{ev.name}</div>
                  <ChevronRight size={14} color="var(--mute)" />
                </div>
                <div className="relay-event-meta">
                  <span className="relay-meta-item"><MapPin size={11} /> {ev.venue}</span>
                  <span className="relay-meta-item"><CalendarClock size={11} /> {ev.schedule}</span>
                  <span className="relay-meta-item"><Users size={11} /> {ev.registered.length}/{ev.capacity} registered</span>
                </div>
              </div>
            ))}

            {selected && (
              <div className="relay-card" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Edit “{selected.name}”
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="relay-field-label">Venue</label>
                    <input
                      className="relay-input"
                      value={draftVenue}
                      onChange={(e) => setDraftVenue(e.target.value)}
                    />
                    <button
                      className="relay-btn"
                      style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                      disabled={running || draftVenue === selected.venue}
                      onClick={() => triggerChange("venue")}
                    >
                      <Send size={12} /> Save venue change
                    </button>
                  </div>
                  <div>
                    <label className="relay-field-label">Schedule</label>
                    <input
                      className="relay-input"
                      value={draftSchedule}
                      onChange={(e) => setDraftSchedule(e.target.value)}
                    />
                    <button
                      className="relay-btn"
                      style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                      disabled={running || draftSchedule === selected.schedule}
                      onClick={() => triggerChange("schedule")}
                    >
                      <Send size={12} /> Save schedule change
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <label className="relay-field-label">Registered participants ({selected.registered.length})</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.registered.map((p) => (
                      <span key={p} className="relay-pill" style={{ color: "var(--paper)", background: "var(--panel-2)" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right: live feed + trace */}
          <div>
            <div className="relay-card" style={{ marginBottom: 14 }}>
              <div className="relay-feed-title">
                <Activity size={13} color="var(--amber)" /> Live operations feed
              </div>
              <div className="relay-feed-list relay-scroll">
                {feed.length === 0 && <div className="relay-empty">No changes yet. Edit a venue or schedule to trigger the pipeline.</div>}
                {feed.map((f) => (
                  <div key={f.id} className="relay-feed-row">
                    <span
                      className="relay-feed-dot"
                      style={{ background: f.level === "amber" ? "var(--amber)" : f.level === "coral" ? "var(--coral)" : f.level === "teal" ? "var(--teal)" : "var(--mute)" }}
                    />
                    <div>
                      <div className="relay-feed-text">{f.text}</div>
                      <div className="relay-feed-ts relay-mono">{f.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relay-card">
              <div className="relay-feed-title">
                <Activity size={13} color="var(--teal)" /> Trace waterfall
              </div>
              {trace.length === 0 && <div className="relay-empty">Spans appear here once a change fires.</div>}
              {trace.map((s, i) => (
                <div className="relay-trace-row" key={i}>
                  <div className="relay-trace-label">{s.name}</div>
                  <div className="relay-trace-track">
                    <div className="relay-trace-bar" style={{ width: `${Math.min(100, s.ms)}%`, background: i % 2 ? "var(--teal)" : "var(--amber)" }} />
                  </div>
                  <div className="relay-trace-ms relay-mono">{s.ms}ms</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Participant view
// ---------------------------------------------------------------------------

function ParticipantView({ events, notifications }) {
  const myEvents = events.filter((e) => e.registered.includes(FOCUS_PARTICIPANT));
  const myNotifs = notifications.filter((n) => n.person === FOCUS_PARTICIPANT);

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1>Hi, {FOCUS_PARTICIPANT.split(" ")[0]}</h1>
          <p>Your registered events and the notifications you've received.</p>
        </div>
      </div>
      <div className="relay-body">
        <div className="relay-grid">
          <div>
            <label className="relay-field-label" style={{ marginBottom: 10, display: "block" }}>Registered events</label>
            {myEvents.map((ev) => (
              <div key={ev.id} className="relay-card" style={{ marginBottom: 8 }}>
                <div className="relay-event-name">{ev.name}</div>
                <div className="relay-event-meta">
                  <span className="relay-meta-item"><MapPin size={11} /> {ev.venue}</span>
                  <span className="relay-meta-item"><CalendarClock size={11} /> {ev.schedule}</span>
                </div>
              </div>
            ))}
            {myEvents.length === 0 && <div className="relay-empty">No registrations.</div>}
          </div>

          <div className="relay-card">
            <div className="relay-feed-title">
              <Bell size={13} color="var(--amber)" /> Notifications ({myNotifs.length})
            </div>
            {myNotifs.length === 0 && (
              <div className="relay-empty">Nothing yet — switch to Event Admin and change a venue or schedule for one of your events to see it land here.</div>
            )}
            <div className="relay-scroll" style={{ maxHeight: 420, overflow: "auto" }}>
              {myNotifs.map((n) => (
                <div key={n.id} className="relay-notif-row">
                  <div className="relay-notif-icon">
                    <ChannelIcon channel={n.channel} size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.eventName}</span>
                      <StatusPill status={n.status} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 3 }}>
                      {n.type === "VenueChanged" ? "Venue changed" : "Schedule changed"} · {n.detail}
                    </div>
                    <div className="relay-feed-ts relay-mono" style={{ marginTop: 3 }}>{n.ts} via {n.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Super Admin dashboard
// ---------------------------------------------------------------------------

function SuperAdminView({ events, notifications, feed }) {
  const totalParticipants = new Set(events.flatMap((e) => e.registered)).size;
  const sent = notifications.filter((n) => n.status === "Sent").length;
  const failedNow = notifications.filter((n) => n.status === "Retrying").length;
  const byChannel = CHANNELS.map((c) => ({
    ...c,
    count: notifications.filter((n) => n.channel === c.key).length,
  }));
  const maxChannel = Math.max(1, ...byChannel.map((c) => c.count));

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1>Operations overview</h1>
          <p>Platform-wide activity across all events and admins.</p>
        </div>
      </div>
      <div className="relay-body">
        <div className="relay-stat-grid">
          <div className="relay-stat-card">
            <div className="relay-stat-num">{events.length}</div>
            <div className="relay-stat-label">Active events</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num">{totalParticipants}</div>
            <div className="relay-stat-label">Registered participants</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num" style={{ color: "var(--teal)" }}>{sent}</div>
            <div className="relay-stat-label">Notifications delivered</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num" style={{ color: "var(--amber)" }}>{failedNow}</div>
            <div className="relay-stat-label">Currently retrying</div>
          </div>
        </div>

        <div className="relay-grid">
          <div className="relay-card">
            <div className="relay-feed-title">Deliveries by channel</div>
            {byChannel.map((c) => (
              <div className="relay-bar-row" key={c.key}>
                <div className="relay-bar-label"><c.icon size={12} /> {c.label}</div>
                <div className="relay-bar-track">
                  <div className="relay-bar-fill" style={{ width: `${(c.count / maxChannel) * 100}%`, background: "var(--teal)" }} />
                </div>
                <div className="relay-bar-val">{c.count}</div>
              </div>
            ))}

            <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div className="relay-feed-title" style={{ marginBottom: 10 }}>Events at a glance</div>
              {events.map((ev) => (
                <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                  <span>{ev.name}</span>
                  <span style={{ color: "var(--mute)" }}>{ev.registered.length}/{ev.capacity} · {ev.venue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relay-card">
            <div className="relay-feed-title">
              <Activity size={13} color="var(--amber)" /> Platform event log
            </div>
            <div className="relay-feed-list relay-scroll">
              {feed.length === 0 && <div className="relay-empty">No domain events yet.</div>}
              {feed.map((f) => (
                <div key={f.id} className="relay-feed-row">
                  <span
                    className="relay-feed-dot"
                    style={{ background: f.level === "amber" ? "var(--amber)" : f.level === "coral" ? "var(--coral)" : f.level === "teal" ? "var(--teal)" : "var(--mute)" }}
                  />
                  <div>
                    <div className="relay-feed-text">{f.text}</div>
                    <div className="relay-feed-ts relay-mono">{f.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
