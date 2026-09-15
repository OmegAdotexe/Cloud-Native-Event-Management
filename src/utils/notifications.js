// ---------------------------------------------------------------------------
// ID generator & timestamp
// ---------------------------------------------------------------------------
let uid = 1;
export const nextId = () => `n${uid++}`;

export function nowStamp() {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", { hour12: false });
}

// ---------------------------------------------------------------------------
// triggerChange — the pipeline simulation extracted from the root component.
// Accepts the pieces it needs as parameters so it has no direct state dependency.
// ---------------------------------------------------------------------------

/**
 * @param {object} opts
 * @param {"venue"|"schedule"} opts.field         — which field changed
 * @param {object}  opts.selected                 — current event object
 * @param {string}  opts.draftVenue
 * @param {string}  opts.draftSchedule
 * @param {boolean} opts.running
 * @param {function} opts.setRunning
 * @param {function} opts.setTrace
 * @param {function} opts.setEvents
 * @param {function} opts.setNotifications
 * @param {function} opts.pushFeed
 * @param {object}   opts.timeoutsRef             — React ref holding timeout IDs
 */
export function triggerChange({
  field,
  selected,
  draftVenue,
  draftSchedule,
  running,
  setRunning,
  setTrace,
  setEvents,
  setNotifications,
  pushFeed,
  timeoutsRef,
}) {
  if (!selected || running) return;

  const changed =
    field === "venue"
      ? draftVenue !== selected.venue
      : draftSchedule !== selected.schedule;
  if (!changed) return;

  /** schedule a timeout and track it so it can be cleaned up */
  function schedule(fn, delay) {
    const t = setTimeout(fn, delay);
    timeoutsRef.current.push(t);
  }

  setRunning(true);
  setTrace([]);

  const eventType = field === "venue" ? "VenueChanged" : "ScheduleChanged";
  const affected = selected.registered;

  // Apply the change to the source-of-truth immediately
  setEvents((evs) =>
    evs.map((e) =>
      e.id === selected.id
        ? {
            ...e,
            venue:    field === "venue"    ? draftVenue    : e.venue,
            schedule: field === "schedule" ? draftSchedule : e.schedule,
          }
        : e
    )
  );

  pushFeed(`${eventType} emitted for "${selected.name}"`, "amber");

  schedule(() => {
    pushFeed(
      `Resolved ${affected.length} affected participant${
        affected.length === 1 ? "" : "s"
      } (registered users only, not the full org)`,
      "info"
    );
    setTrace((t) => [...t, { name: "Resolve affected participants (DB)", ms: 42 }]);
  }, 500);

  schedule(() => {
    pushFeed("Notification event published → RabbitMQ notify-queue (simulated)", "info");
    setTrace((t) => [...t, { name: "Publish to RabbitMQ", ms: 15 }]);
  }, 1100);

  schedule(() => {
    pushFeed(
      `Notification Worker consumed message, dispatching to ${affected.length} recipients across WhatsApp / Email / Web`,
      "info"
    );
    setTrace((t) => [...t, { name: "Notification Worker consume", ms: 20 }]);
  }, 1700);

  // Dispatch per participant, per channel
  let cursor = 2200;
  affected.forEach((person, i) => {
    const channelsForPerson =
      i % 3 === 0
        ? ["whatsapp", "email"]
        : i % 3 === 1
        ? ["whatsapp", "web"]
        : ["email", "web"];

    channelsForPerson.forEach((ch) => {
      const willFailFirst = (i + ch.length) % 5 === 0; // deterministic variety
      const id = nextId();
      cursor += 140;
      const delaySend = cursor;

      schedule(() => {
        setNotifications((n) =>
          [
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
          ].slice(0, 60)
        );
      }, delaySend);

      schedule(() => {
        setNotifications((n) =>
          n.map((row) =>
            row.id === id
              ? { ...row, status: willFailFirst ? "Retrying" : "Sent" }
              : row
          )
        );
        if (willFailFirst) {
          pushFeed(
            `Delivery to ${person} via ${ch} failed — retry scheduled`,
            "coral"
          );
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
    setTrace((t) => [
      ...t,
      { name: "Channel dispatch (WhatsApp / Email / Web)", ms: 110 },
    ]);
    pushFeed(`Delivery cycle complete for "${selected.name}"`, "teal");
    setRunning(false);
  }, finalDelay);
}
