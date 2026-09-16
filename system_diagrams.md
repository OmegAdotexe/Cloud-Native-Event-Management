# Cloud-Native Event Management Platform — Diagrams

---

## 1. Activity Diagram — Event Lifecycle & Registration Flow

This diagram captures the full lifecycle from event creation through registration, approval, timeline management, and notification delivery.

```mermaid
flowchart TD
    Start(["🟢 Start"])
    Start --> Login["Admin / Participant Logs In"]
    Login --> AuthCheck{"Authenticated?"}
    AuthCheck -->|No| LoginFail["Show Error"]
    LoginFail --> Login
    AuthCheck -->|Yes| RoleCheck{"User Role?"}

    RoleCheck -->|EVENT_ADMIN / SUPER_ADMIN| AdminActions
    RoleCheck -->|PARTICIPANT| ParticipantActions

    subgraph AdminActions["Admin Actions"]
        CreateEvent["Create Event (DRAFT)"]
        CreateEvent --> EditEvent["Edit Event Details"]
        EditEvent --> PublishDecision{"Publish Event?"}
        PublishDecision -->|No| EditEvent
        PublishDecision -->|Yes| PublishEvent["Publish Event"]
        PublishEvent --> ManageEvent{"Manage Event"}
        ManageEvent --> UpdateEvent["Update Event Details"]
        UpdateEvent --> EmitUpdateEvent["Emit EventUpdatedEvent"]
        EmitUpdateEvent --> ManageEvent
        ManageEvent --> ManageTimeline["Create/Edit/Delete Timeline Items"]
        ManageTimeline --> EmitTimelineEvent["Emit TimelineItemCreated/Updated/DeletedEvent"]
        EmitTimelineEvent --> ManageEvent
        ManageEvent --> ManageRegistrations["View Registrations"]
        ManageRegistrations --> RegAction{"Registration Action"}
        RegAction --> ApproveReg["Approve Registration"]
        ApproveReg --> EmitConfirm["Emit RegistrationConfirmedEvent"]
        EmitConfirm --> ManageRegistrations
        RegAction --> RejectReg["Reject Registration (with Reason)"]
        RejectReg --> EmitReject["Emit RegistrationRejectedEvent"]
        EmitReject --> ManageRegistrations
        RegAction --> CancelReg["Cancel Registration (with Reason)"]
        CancelReg --> EmitCancel["Emit RegistrationCancelledEvent"]
        EmitCancel --> ManageRegistrations
        ManageEvent --> CancelEvent["Cancel Event (with Reason)"]
        CancelEvent --> EmitEventCancel["Emit EventCancelledEvent"]
    end

    subgraph ParticipantActions["Participant Actions"]
        BrowseEvents["Browse Published Events"]
        BrowseEvents --> SelectEvent["Select Event"]
        SelectEvent --> CheckDeadline{"Registration Deadline Passed?"}
        CheckDeadline -->|Yes| DeadlineError["Show Deadline Expired"]
        CheckDeadline -->|No| CheckMode{"Registration Mode?"}
        CheckMode -->|OPEN| RegisterOpen["Register → CONFIRMED"]
        RegisterOpen --> EmitConfirmP["Emit RegistrationConfirmedEvent"]
        CheckMode -->|APPROVAL_REQUIRED| RegisterApproval["Register → PENDING"]
        RegisterApproval --> EmitPending["Emit RegistrationPendingEvent (to Admin)"]
        EmitPending --> WaitApproval["Wait for Admin Decision"]
        CheckMode -->|INVITE_ONLY| InviteCheck{"Has Invite?"}
        InviteCheck -->|No| InviteError["Show Not Invited"]
        InviteCheck -->|Yes| RegisterOpen
        EmitConfirmP --> ViewRegistrations
        WaitApproval --> ViewRegistrations
        ViewRegistrations["View My Registrations"]
        ViewRegistrations --> ExpandReg["Expand Registration Details"]
        ExpandReg --> ViewTimeline["View Event Timeline"]
        ExpandReg --> ViewReason["View Cancellation/Rejection Reason"]
        ViewRegistrations --> SelfCancel["Cancel Own Registration"]
        SelfCancel --> EmitSelfCancel["Emit RegistrationCancelledEvent"]
        ViewNotifications["View Notifications"]
        ViewNotifications --> ClickNotif{"Click Notification"}
        ClickNotif -->|Registration Type| ViewRegistrations
        ClickNotif -->|Event/Timeline Type| BrowseEvents
    end

    EmitConfirm --> NotifFlow
    EmitReject --> NotifFlow
    EmitCancel --> NotifFlow
    EmitEventCancel --> NotifFlow
    EmitUpdateEvent --> NotifFlow
    EmitTimelineEvent --> NotifFlow
    EmitConfirmP --> NotifFlow
    EmitPending --> NotifFlow
    EmitSelfCancel --> NotifFlow

    subgraph NotifFlow["Notification Pipeline"]
        ListenEvent["@TransactionalEventListener (AFTER_COMMIT)"]
        ListenEvent --> ProduceMsg["NotificationProducer formats message"]
        ProduceMsg --> RabbitMQ["Publish to RabbitMQ Exchange"]
        RabbitMQ --> Consumer["NotificationConsumer receives message"]
        Consumer --> Dedup{"Duplicate messageId?"}
        Dedup -->|Yes| Skip["Skip (idempotent)"]
        Dedup -->|No| SaveDB["Save Notification to PostgreSQL"]
        SaveDB --> Delivered["Notification visible In-App"]
    end

    Delivered --> End(["🔴 End"])
    DeadlineError --> End
    InviteError --> End
```

---

## 2. DFD Level 0 — Context Diagram

Shows the entire system as a single process interacting with external entities.

```mermaid
flowchart LR
    Admin(["👤 Event Admin / Super Admin"])
    Participant(["👤 Participant"])
    PG[("🗄️ PostgreSQL")]
    RMQ[("🐇 RabbitMQ")]

    Admin -->|"Create/Update/Cancel Event, Manage Registrations, Manage Timeline"| System["Cloud-Native Event Management Platform"]
    System -->|"Event Details, Registration List, Notifications"| Admin

    Participant -->|"Register/Cancel, Browse Events, View Notifications"| System
    System -->|"Registration Status, Event Details, Timeline, Notifications"| Participant

    System <-->|"Persist & Query Data"| PG
    System <-->|"Publish & Consume Notification Messages"| RMQ
```

---

## 3. DFD Level 1 — Subsystem Decomposition

Decomposes the platform into its core subsystems.

```mermaid
flowchart TB
    Admin(["👤 Admin"])
    Participant(["👤 Participant"])

    subgraph Platform["Cloud-Native Event Management Platform"]
        P1["1.0 Authentication & Authorization"]
        P2["2.0 Event Management"]
        P3["3.0 Registration Management"]
        P4["4.0 Timeline Management"]
        P5["5.0 Notification Engine"]
    end

    PG[("🗄️ PostgreSQL")]
    RMQ[("🐇 RabbitMQ")]

    Admin -->|"Credentials"| P1
    Participant -->|"Credentials"| P1
    P1 -->|"JWT Token"| Admin
    P1 -->|"JWT Token"| Participant
    P1 <-->|"User Data"| PG

    Admin -->|"Event CRUD Operations"| P2
    Participant -->|"Browse Events"| P2
    P2 -->|"Event Responses"| Admin
    P2 -->|"Published Event List"| Participant
    P2 <-->|"Events, Change Logs"| PG
    P2 -->|"Domain Events (Published, Updated, Cancelled)"| P5

    Participant -->|"Register / Cancel"| P3
    Admin -->|"Approve / Reject / Cancel Registration"| P3
    P3 -->|"Registration Status"| Participant
    P3 -->|"Registration List"| Admin
    P3 <-->|"Registrations"| PG
    P3 -->|"Domain Events (Confirmed, Pending, Rejected, Cancelled)"| P5

    Admin -->|"Create/Edit/Delete Timeline Items"| P4
    Participant -->|"View Timeline"| P4
    P4 -->|"Timeline Data"| Admin
    P4 -->|"Timeline Data"| Participant
    P4 <-->|"Timeline Items, Change Logs"| PG
    P4 -->|"Domain Events (Created, Updated, Deleted)"| P5

    P5 -->|"Publish Messages"| RMQ
    RMQ -->|"Consume Messages"| P5
    P5 <-->|"Notifications"| PG
    P5 -->|"In-App Notifications"| Participant
    P5 -->|"In-App Notifications"| Admin
```

---

## 4. DFD Level 2 — Detailed Process Decomposition

### 4a. Process 2.0 — Event Management (Detailed)

```mermaid
flowchart TB
    Admin(["👤 Admin"])
    Participant(["👤 Participant"])

    subgraph EventMgmt["2.0 Event Management"]
        P2_1["2.1 Create Event"]
        P2_2["2.2 Update Event"]
        P2_3["2.3 Publish Event"]
        P2_4["2.4 Cancel Event"]
        P2_5["2.5 Delete Event"]
        P2_6["2.6 List / Get Events"]
    end

    EventsDB[("D1: Events Table")]
    ChangeLogDB[("D2: Event Change Logs")]
    NotifEngine["5.0 Notification Engine"]

    Admin -->|"CreateEventRequest (title, venue, dates, capacity, mode)"| P2_1
    P2_1 -->|"INSERT Event (DRAFT)"| EventsDB
    P2_1 -->|"EventResponse"| Admin

    Admin -->|"UpdateEventRequest (partial fields)"| P2_2
    P2_2 -->|"Read existing Event"| EventsDB
    P2_2 -->|"UPDATE Event"| EventsDB
    P2_2 -->|"Log field changes"| ChangeLogDB
    P2_2 -->|"EventUpdatedEvent (changed fields map)"| NotifEngine
    P2_2 -->|"EventResponse"| Admin

    Admin -->|"Publish command"| P2_3
    P2_3 -->|"SET status=PUBLISHED"| EventsDB
    P2_3 -->|"EventPublishedEvent"| NotifEngine

    Admin -->|"CancelEventRequest (reason)"| P2_4
    P2_4 -->|"SET status=CANCELLED, reason, cancelledAt"| EventsDB
    P2_4 -->|"Log status change"| ChangeLogDB
    P2_4 -->|"EventCancelledEvent (title, reason)"| NotifEngine

    Admin -->|"Delete command"| P2_5
    P2_5 -->|"DELETE Event + Change Logs"| EventsDB

    Participant -->|"Browse / Get by ID"| P2_6
    Admin -->|"Browse / Get by ID"| P2_6
    P2_6 -->|"Query Events"| EventsDB
    P2_6 -->|"EventResponse list"| Participant
    P2_6 -->|"EventResponse list"| Admin
```

### 4b. Process 3.0 — Registration Management (Detailed)

```mermaid
flowchart TB
    Participant(["👤 Participant"])
    Admin(["👤 Admin"])

    subgraph RegMgmt["3.0 Registration Management"]
        P3_1["3.1 Register for Event"]
        P3_2["3.2 Cancel Registration"]
        P3_3["3.3 Approve Registration"]
        P3_4["3.4 Reject Registration"]
        P3_5["3.5 List Registrations"]
        P3_6["3.6 View My Registrations"]
    end

    EventsDB[("D1: Events Table")]
    RegDB[("D3: Registrations Table")]
    NotifEngine["5.0 Notification Engine"]

    Participant -->|"POST /registrations"| P3_1
    P3_1 -->|"findByIdForUpdate (lock row)"| EventsDB
    P3_1 -->|"Check mode, capacity, deadline, duplicates"| P3_1
    P3_1 -->|"INSERT Registration (CONFIRMED / PENDING / WAITLISTED)"| RegDB
    P3_1 -->|"RegistrationConfirmedEvent OR RegistrationPendingEvent OR RegistrationWaitlistedEvent"| NotifEngine
    P3_1 -->|"RegistrationResponse"| Participant

    Participant -->|"POST /cancel (optional reason)"| P3_2
    Admin -->|"POST /cancel (with reason)"| P3_2
    P3_2 -->|"SET status=CANCELLED, reason, cancelledAt"| RegDB
    P3_2 -->|"RegistrationCancelledEvent (reason)"| NotifEngine

    Admin -->|"POST /approve"| P3_3
    P3_3 -->|"SET status=CONFIRMED, respondedAt, respondedByAdminId"| RegDB
    P3_3 -->|"RegistrationConfirmedEvent"| NotifEngine

    Admin -->|"POST /reject (with reason)"| P3_4
    P3_4 -->|"SET status=REJECTED, reason, respondedAt"| RegDB
    P3_4 -->|"RegistrationRejectedEvent"| NotifEngine

    Admin -->|"GET /registrations?status&page"| P3_5
    P3_5 -->|"Query by event + optional status filter"| RegDB
    P3_5 -->|"Page of RegistrationResponse"| Admin

    Participant -->|"GET /me/registrations"| P3_6
    P3_6 -->|"Query by participant"| RegDB
    P3_6 -->|"List of RegistrationResponse (with reason)"| Participant
```

### 4c. Process 5.0 — Notification Engine (Detailed)

```mermaid
flowchart TB
    DomainEvents(["Domain Events from 2.0, 3.0, 4.0"])

    subgraph NotifEngine["5.0 Notification Engine"]
        P5_1["5.1 NotificationProducer (Event Listener)"]
        P5_2["5.2 Message Formatting & Routing"]
        P5_3["5.3 NotificationConsumer (Queue Listener)"]
        P5_4["5.4 Deduplication Check"]
        P5_5["5.5 Persist Notification"]
        P5_6["5.6 Query Notifications"]
        P5_7["5.7 Mark as Read"]
    end

    RegDB[("D3: Registrations Table")]
    RMQ[("🐇 RabbitMQ")]
    NotifDB[("D4: Notifications Table")]
    Recipient(["👤 Recipient (Admin or Participant)"])

    DomainEvents -->|"@TransactionalEventListener AFTER_COMMIT"| P5_1
    P5_1 -->|"Lookup event title, participant name"| RegDB
    P5_1 -->|"Format human-readable message"| P5_2
    P5_2 -->|"Publish NotificationMessage (JSON)"| RMQ

    RMQ -->|"Consume from notification.queue"| P5_3
    P5_3 -->|"Check messageId exists?"| P5_4
    P5_4 -->|"Duplicate → Skip"| P5_3
    P5_4 -->|"New → Proceed"| P5_5
    P5_5 -->|"INSERT Notification (IN_APP, PENDING)"| NotifDB

    Recipient -->|"GET /notifications?page&size"| P5_6
    P5_6 -->|"Query by recipientId, ordered by createdAt DESC"| NotifDB
    P5_6 -->|"Page of NotificationResponse"| Recipient

    Recipient -->|"POST /notifications/{id}/read"| P5_7
    P5_7 -->|"SET readAt = now()"| NotifDB
```

---

## 5. Sequence Diagram — Registration with Approval Flow

This covers the end-to-end flow: a Participant registers for an approval-required event, the Admin approves, and the Participant receives an in-app notification.

```mermaid
sequenceDiagram
    actor P as Participant
    participant FE as React Frontend
    participant RC as RegistrationController
    participant RS as RegistrationService
    participant ER as EventRepository
    participant RR as RegistrationRepository
    participant AEP as ApplicationEventPublisher
    participant NP as NotificationProducer
    participant RMQ as RabbitMQ
    participant NC as NotificationConsumer
    participant NR as NotificationRepository
    actor A as Admin

    Note over P, NR: Phase 1 — Participant Registers

    P->>FE: Click "Register" on event
    FE->>RC: POST /api/events/{eventId}/registrations
    RC->>RS: registerForEvent(eventId, user)
    RS->>ER: findByIdForUpdate(eventId)
    ER-->>RS: Event (mode=APPROVAL_REQUIRED)
    RS->>RR: existsByParticipantAndEvent(user, event)
    RR-->>RS: false (no duplicate)
    RS->>RS: Check capacity, deadline ✓
    RS->>RR: save(Registration{status=PENDING})
    RR-->>RS: saved Registration
    RS->>AEP: publish(RegistrationPendingEvent)
    RS-->>RC: RegistrationResponse{status=PENDING}
    RC-->>FE: 200 OK {status: PENDING}
    FE-->>P: Show "Registration Pending Approval"

    Note over AEP, NR: Async: Notify Admin of pending request

    AEP-)NP: handleRegistrationPending() [AFTER_COMMIT]
    NP->>RR: findById(registrationId)
    RR-->>NP: Registration (with event title + participant name)
    NP->>NP: Format: "John has requested to join: Annual Hackathon"
    NP->>RMQ: publish(NotificationMessage{recipientId=adminId})
    RMQ-)NC: consume(NotificationMessage)
    NC->>NR: findByMessageId(msgId)
    NR-->>NC: null (not duplicate)
    NC->>NR: save(Notification{type=REGISTRATION_PENDING})

    Note over A, NR: Phase 2 — Admin Approves

    A->>FE: View Registrations → Click "Approve"
    FE->>RC: POST /api/events/{eventId}/registrations/{id}/approve
    RC->>RS: approveRegistration(eventId, id, admin)
    RS->>RR: findById(id)
    RR-->>RS: Registration{status=PENDING}
    RS->>RS: Set status=CONFIRMED, respondedAt, respondedByAdminId
    RS->>RR: save(Registration)
    RS->>AEP: publish(RegistrationConfirmedEvent)
    RS-->>RC: RegistrationResponse{status=CONFIRMED}
    RC-->>FE: 200 OK
    FE-->>A: Registration list refreshed

    Note over AEP, NR: Async: Notify Participant of approval

    AEP-)NP: handleRegistrationConfirmed() [AFTER_COMMIT]
    NP->>RR: findById(registrationId)
    RR-->>NP: Registration (with event title)
    NP->>NP: Format: "Your registration has been confirmed for: Annual Hackathon"
    NP->>RMQ: publish(NotificationMessage{recipientId=participantId})
    RMQ-)NC: consume(NotificationMessage)
    NC->>NR: findByMessageId(msgId)
    NR-->>NC: null (not duplicate)
    NC->>NR: save(Notification{type=REGISTRATION_CONFIRMED})

    Note over P, FE: Phase 3 — Participant views notification

    P->>FE: Open Notifications page
    FE->>RC: GET /api/v1/notifications?page=0&size=20
    RC-->>FE: [{title: "Registration Confirmed", message: "...Annual Hackathon"}]
    FE-->>P: Show notification card
    P->>FE: Click notification
    FE->>FE: navigate("/my-registrations")
    P->>FE: Click registration card to expand
    FE-->>P: Show timeline + registration details
```
