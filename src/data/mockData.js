import {
  MessageCircle,
  Mail,
  Globe,
} from "lucide-react";

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
export const PEOPLE = [
  "Aarav Mehta",
  "Priya Nair",
  "Karan Shah",
  "Ishita Verma",
  "Rohan Gupta",
  "Ananya Iyer",
  "Vikram Rao",
  "Sneha Kulkarni",
  "Aditya Bose",
  "Meera Pillai",
  "Yash Kapoor",
  "Diya Kulkarni",
];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const initialEvents = [
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

// ---------------------------------------------------------------------------
// Notification channels
// ---------------------------------------------------------------------------
export const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "email",    label: "Email",    icon: Mail },
  { key: "web",      label: "Web / In-app", icon: Globe },
];

// ---------------------------------------------------------------------------
// Participant used for the demo Participant view
// ---------------------------------------------------------------------------
export const FOCUS_PARTICIPANT = "Priya Nair";
