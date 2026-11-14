import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Radio, Calendar, Users, MapPin, Sparkles, ArrowRight,
  Code2, Music, Trophy, BookOpen, Star, QrCode, Bell,
  Shield, Cloud, ExternalLink, ChevronRight, Sun, Moon,
  CheckCircle2, PlusCircle, Github, Linkedin, Mail
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import * as relayApi from "../api/relayApi.js";
import EventCard from "../components/EventCard.jsx";
import { CURATED_EVENT_IMAGES, getEventCoverImage } from "../data/eventAssets.js";

const CATEGORY_CONFIGS = [
  { id: "WORKSHOP", name: "Technical & Hackathons", icon: Code2, bg: "var(--blue-light)", color: "var(--blue)" },
  { id: "CULTURAL", name: "Cultural & Arts", icon: Music, bg: "var(--coral-light)", color: "var(--coral)" },
  { id: "SPORTS", name: "Sports & Athletics", icon: Trophy, bg: "var(--teal-light)", color: "var(--teal)" },
  { id: "SEMINAR", name: "Keynote Seminars", icon: BookOpen, bg: "var(--primary-light)", color: "var(--primary)" },
  { id: "OTHER", name: "Campus Competitions", icon: Star, bg: "var(--amber-light)", color: "var(--amber)" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [events, setEvents] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    setIsLoading(true);
    // Fetch live public events from backend database
    relayApi.getPublicEvents()
      .then((data) => {
        setEvents(data || []);
      })
      .catch((err) => {
        console.warn("Public events fetch failed, attempting authenticated fallback:", err);
        relayApi.getEvents().then(setEvents).catch(() => setEvents([]));
      })
      .finally(() => setIsLoading(false));

    // Fetch authoritative category statistics from backend
    relayApi.getCategoryStats()
      .then((stats) => {
        if (stats) setCategoryStats(stats);
      })
      .catch((err) => console.warn("Failed to load category statistics:", err));
  }, []);

  const handleExploreClick = () => {
    if (user) {
      navigate("/events");
    } else {
      const el = document.getElementById("events-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else navigate("/login");
    }
  };

  const handleOrganizeClick = () => {
    if (user) {
      if (role === "EVENT_ADMIN" || role === "SUPER_ADMIN") {
        navigate("/events", { state: { create: true } });
      } else {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  };

  // Compute live category statistics dynamically
  const categories = CATEGORY_CONFIGS.map(cat => {
    const count = categoryStats[cat.id] ?? 0;
    return {
      ...cat,
      count: `${count} Event${count === 1 ? "" : "s"}`,
    };
  });

  // Filter events by selected category
  const displayedEvents = events.filter((e) => {
    if (activeCategory === "ALL") return true;
    return e.category === activeCategory;
  });

  return (
    <div className="cc-landing-page">
      {/* ── Modern Navigation Bar ───────────────────────────────── */}
      <nav className="cc-landing-nav">
        <div className="cc-brand-badge" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="cc-brand-icon">
            <Radio size={20} />
          </div>
          <span className="cc-brand-title">CampusConnect</span>
        </div>

        <div className="cc-nav-menu">
          <a href="#events-section" className="cc-nav-link">Explore Events</a>
          <a href="#categories-section" className="cc-nav-link">Categories</a>
          <a href="#features-section" className="cc-nav-link">Platform Features</a>
          <a href="#about-section" className="cc-nav-link">About</a>
        </div>

        <div className="cc-nav-actions">
          <button
            type="button"
            className="relay-btn-ghost"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            style={{ padding: "8px 10px", borderRadius: "10px" }}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user ? (
            <button
              type="button"
              className="cc-btn-primary"
              onClick={() => navigate("/")}
              style={{ padding: "9px 18px", fontSize: "13.5px" }}
            >
              Go to Dashboard <ChevronRight size={15} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="relay-btn-ghost"
                onClick={() => navigate("/login")}
                style={{ padding: "9px 16px", fontSize: "13.5px" }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="cc-btn-primary"
                onClick={() => navigate("/register")}
                style={{ padding: "9px 18px", fontSize: "13.5px" }}
              >
                Join CampusConnect
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <header className="cc-hero-section">
        <div className="cc-hero-grid">
          <div>
            <div className="cc-hero-badge">
              <Sparkles size={14} />
              <span>Next-Gen University Event Hub</span>
            </div>

            <h1 className="cc-hero-headline">
              Discover. Organize. <br />
              <span className="cc-gradient-text">Experience Campus Events.</span>
            </h1>

            <p className="cc-hero-subtitle">
              The unified cloud-native platform for university life — empowering students, clubs, and faculty to discover groundbreaking hackathons, vibrant cultural fests, sports championships, and workshops in real-time.
            </p>

            <div className="cc-hero-cta-group">
              <button type="button" className="cc-btn-primary" onClick={handleExploreClick}>
                Explore Events <ArrowRight size={16} />
              </button>
              <button type="button" className="cc-btn-secondary" onClick={handleOrganizeClick}>
                <PlusCircle size={16} /> Organize an Event
              </button>
            </div>
          </div>

          <div className="cc-hero-visual-card">
            <img
              src={CURATED_EVENT_IMAGES.CAMPUS_HERO}
              alt="University Campus Life"
              loading="eager"
            />
            <div className="cc-hero-overlay-stats">
              <div className="cc-hero-stat-item">
                <div className="val">50+</div>
                <div className="lbl">Active Clubs</div>
              </div>
              <div className="cc-hero-stat-item">
                <div className="val">10K+</div>
                <div className="lbl">Registrations</div>
              </div>
              <div className="cc-hero-stat-item">
                <div className="val">100%</div>
                <div className="lbl">Real-Time</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Event Categories Section ───────────────────────────── */}
      <section id="categories-section" className="cc-section">
        <div className="cc-section-title-wrap">
          <div className="cc-section-pill">Browse By Category</div>
          <h2 className="cc-section-heading">Curated Campus Experiences</h2>
          <p className="cc-section-subheading">
            Whatever your passion — coding, music, debate, or athletics — CampusConnect brings every society and event to your fingertips.
          </p>
        </div>

        <div className="cc-categories-grid">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="cc-category-card"
                onClick={() => {
                  setActiveCategory(isSelected ? "ALL" : cat.id);
                  const el = document.getElementById("events-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  borderColor: isSelected ? "var(--primary)" : undefined,
                  background: isSelected ? "var(--primary-light)" : undefined,
                }}
              >
                <div className="cc-category-icon-box" style={{ background: cat.bg, color: cat.color }}>
                  <Icon size={24} />
                </div>
                <div className="cc-category-name">{cat.name}</div>
                <div className="cc-category-count">{cat.count}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Featured & Upcoming Events Section ─────────────────── */}
      <section id="events-section" className="cc-section" style={{ paddingTop: 0 }}>
        <div className="cc-section-title-wrap">
          <div className="cc-section-pill">Live on Campus</div>
          <h2 className="cc-section-heading">Featured & Upcoming Events</h2>
          <p className="cc-section-subheading">
            {activeCategory === "ALL"
              ? "Handpicked campus activities taking place across the university this semester."
              : `Showing events in category: ${activeCategory}`}
          </p>
        </div>

        {displayedEvents.length > 0 ? (
          <div className="cc-events-grid">
            {displayedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="rich"
                onClick={() => {
                  if (user) navigate(`/event/${event.id}`);
                  else navigate("/login");
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            padding: "54px 24px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "20px",
            border: "1px dashed var(--border)",
            margin: "20px 0"
          }}>
            <Calendar size={38} style={{ color: "var(--mute)", margin: "0 auto 14px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              No Events Found in this Category
            </h3>
            <p style={{ fontSize: "13px", color: "var(--mute)", margin: "6px 0 18px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
              There are currently no active public events published in {activeCategory === "ALL" ? "the university" : activeCategory}. Check back soon or view all campus categories.
            </p>
            {activeCategory !== "ALL" && (
              <button 
                type="button"
                className="relay-btn-ghost relay-btn-sm" 
                onClick={() => setActiveCategory("ALL")}
              >
                Browse All Categories
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Platform Features & Highlights ─────────────────────── */}
      <section id="features-section" className="cc-section" style={{ background: "var(--surface)", borderRadius: "28px", border: "1px solid var(--border)", margin: "40px auto 80px" }}>
        <div className="cc-section-title-wrap">
          <div className="cc-section-pill">Why CampusConnect</div>
          <h2 className="cc-section-heading">Engineered for Event Excellence</h2>
          <p className="cc-section-subheading">
            Enterprise-grade cloud infrastructure meeting modern, intuitive student experiences.
          </p>
        </div>

        <div className="cc-features-grid">
          <div className="cc-feature-card">
            <div className="cc-feature-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <QrCode size={22} />
            </div>
            <h3 className="cc-feature-title">Instant QR Verification</h3>
            <p className="cc-feature-desc">
              Every registration issues a secure digital pass with offline-ready QR codes for zero-friction check-ins at entry gates.
            </p>
          </div>

          <div className="cc-feature-card">
            <div className="cc-feature-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}>
              <Bell size={22} />
            </div>
            <h3 className="cc-feature-title">Real-Time Messaging</h3>
            <p className="cc-feature-desc">
              RabbitMQ message queuing delivers immediate notifications when venues change, timelines update, or waitlist seats open.
            </p>
          </div>

          <div className="cc-feature-card">
            <div className="cc-feature-icon" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
              <Shield size={22} />
            </div>
            <h3 className="cc-feature-title">Role-Based Operations</h3>
            <p className="cc-feature-desc">
              Tailored dashboards for students, club leads, and faculty admins with granular approval workflows and CSV reporting.
            </p>
          </div>

          <div className="cc-feature-card">
            <div className="cc-feature-icon" style={{ background: "var(--coral-light)", color: "var(--coral)" }}>
              <Cloud size={22} />
            </div>
            <h3 className="cc-feature-title">Cloud-Native Reliability</h3>
            <p className="cc-feature-desc">
              Backed by AWS S3 media storage, RDS PostgreSQL, and containerized Spring Boot microservices capable of high traffic.
            </p>
          </div>
        </div>
      </section>

      {/* ── Meet the Developers ─────────────────────────────────── */}
      <section id="developers-section" className="cc-section" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="cc-section-header">
          <div className="cc-section-pill">Engineering Team</div>
          <h2 className="cc-section-heading">Meet the Developers</h2>
          <p className="cc-section-subheading">
            The software engineers behind CampusConnect's cloud-native architecture, distributed messaging, and intuitive university experience.
          </p>
        </div>

        <div className="cc-dev-grid">
          {/* Aditya Bansal */}
          <div className="cc-dev-card">
            <div className="cc-dev-avatar" style={{ background: "linear-gradient(135deg, #6C3BEE, #A78BFA)" }}>
              AB
            </div>
            <div className="cc-dev-name">Aditya Bansal</div>
            <div className="cc-dev-role">Full-Stack Cloud Architect & Lead Developer</div>
            <p className="cc-dev-bio">
              Led the microservice and event-driven architecture, designing Spring Boot core APIs, PostgreSQL schema optimization, and AWS production infrastructure deployment.
            </p>
            <div className="cc-dev-tags">
              <span className="cc-dev-tag">Spring Boot</span>
              <span className="cc-dev-tag">AWS EC2 / S3</span>
              <span className="cc-dev-tag">PostgreSQL</span>
              <span className="cc-dev-tag">RabbitMQ</span>
              <span className="cc-dev-tag">Architecture</span>
            </div>
            <div className="cc-dev-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="GitHub Profile">
                <Github size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="LinkedIn Profile">
                <Linkedin size={16} />
              </a>
              <a href="mailto:contact@campusconnect.edu" className="cc-dev-link-btn" title="Contact Email">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Tanshi */}
          <div className="cc-dev-card">
            <div className="cc-dev-avatar" style={{ background: "linear-gradient(135deg, #EC4899, #F472B6)" }}>
              T
            </div>
            <div className="cc-dev-name">Tanshi</div>
            <div className="cc-dev-role">Frontend & UI/UX Experience Lead</div>
            <p className="cc-dev-bio">
              Architected the modern React interface, responsive navigation systems, dynamic event directory filters, and accessible component library.
            </p>
            <div className="cc-dev-tags">
              <span className="cc-dev-tag">React.js</span>
              <span className="cc-dev-tag">UI/UX Design</span>
              <span className="cc-dev-tag">Responsive Layouts</span>
              <span className="cc-dev-tag">Design Systems</span>
              <span className="cc-dev-tag">Vite</span>
            </div>
            <div className="cc-dev-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="GitHub Profile">
                <Github size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="LinkedIn Profile">
                <Linkedin size={16} />
              </a>
              <a href="mailto:contact@campusconnect.edu" className="cc-dev-link-btn" title="Contact Email">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Ishan Prabhakar */}
          <div className="cc-dev-card">
            <div className="cc-dev-avatar" style={{ background: "linear-gradient(135deg, #0EA5E9, #38BDF8)" }}>
              IP
            </div>
            <div className="cc-dev-name">Ishan Prabhakar</div>
            <div className="cc-dev-role">Backend Systems & DevOps Engineer</div>
            <p className="cc-dev-bio">
              Engineered containerization workflows, robust database migrations, reverse proxy routing with Nginx, and real-time notification pipelines for approval workflows.
            </p>
            <div className="cc-dev-tags">
              <span className="cc-dev-tag">Docker</span>
              <span className="cc-dev-tag">Nginx</span>
              <span className="cc-dev-tag">DevOps CI/CD</span>
              <span className="cc-dev-tag">API Security</span>
              <span className="cc-dev-tag">Event Queues</span>
            </div>
            <div className="cc-dev-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="GitHub Profile">
                <Github size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="cc-dev-link-btn" title="LinkedIn Profile">
                <Linkedin size={16} />
              </a>
              <a href="mailto:contact@campusconnect.edu" className="cc-dev-link-btn" title="Contact Email">
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer id="about-section" className="cc-footer">
        <div className="cc-footer-inner">
          <div className="cc-footer-col">
            <div className="cc-brand-badge" style={{ marginBottom: "16px" }}>
              <div className="cc-brand-icon">
                <Radio size={20} />
              </div>
              <span className="cc-brand-title" style={{ color: "#fff" }}>CampusConnect</span>
            </div>
            <p style={{ color: "#9691B8", fontSize: "13.5px", lineHeight: "1.6", maxWidth: "340px" }}>
              The cloud-native university event management system empowering thousands of campus leaders and students every day.
            </p>
          </div>

          <div className="cc-footer-col">
            <h4>Explore</h4>
            <ul className="cc-footer-links">
              <li><a href="#events-section">All Events</a></li>
              <li><a href="#categories-section">Categories</a></li>
              <li><a href="#features-section">Platform Features</a></li>
              <li><a href="#developers-section">Engineering Team</a></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </div>

          <div className="cc-footer-col">
            <h4>Organizers</h4>
            <ul className="cc-footer-links">
              <li><a href="#features-section">Host an Event</a></li>
              <li><a href="#features-section">QR Ticket Scanner</a></li>
              <li><a href="#features-section">Event Guidelines</a></li>
              <li><a href="#features-section">Club Verification</a></li>
            </ul>
          </div>

          <div className="cc-footer-col">
            <h4>Infrastructure</h4>
            <ul className="cc-footer-links">
              <li><a href="#features-section">AWS CloudFormation</a></li>
              <li><a href="#features-section">Spring Boot API</a></li>
              <li><a href="#features-section">RabbitMQ Broker</a></li>
              <li><a href="#features-section">PostgreSQL DB</a></li>
            </ul>
          </div>
        </div>

        <div className="cc-footer-bottom">
          <div>© {new Date().getFullYear()} CampusConnect (Relay). All rights reserved.</div>
          <div style={{ display: "flex", gap: "20px" }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

