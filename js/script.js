const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* ---------- Theme ---------- */

const themeToggle = $("#themeToggle");
const root = document.documentElement;

const applyTheme = (theme) => {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("portfolio-theme", theme);
};

applyTheme(localStorage.getItem("portfolio-theme") || "dark");

themeToggle?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

/* ---------- Header, progress bar, mobile menu ---------- */

const header = $("#siteHeader");
const progressBar = $("#progressBar");
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 20);

  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const closeMenu = () => {
  navLinks.classList.remove("open");
  menuToggle.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
};

menuToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});

$$(".nav-link").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("click", (e) => {
  if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
    closeMenu();
  }
});

/* ---------- Active nav link ---------- */

const linkFor = (id) => $(`.nav-link[href="#${id}"]`);
const sections = $$("main section[id]").filter((s) => linkFor(s.id));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$(".nav-link").forEach((l) => l.classList.remove("active"));
      linkFor(entry.target.id)?.classList.add("active");
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((s) => sectionObserver.observe(s));

/* ---------- Reveal on scroll + skill bars ---------- */

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

$$(".reveal").forEach((el) => revealObserver.observe(el));

const skillObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$(".skill", entry.target).forEach((skill, i) => {
        const fill = $(".skill-fill", skill);
        setTimeout(() => {
          fill.style.width = `${skill.dataset.level}%`;
        }, i * 140);
      });
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.3 }
);

$$(".skill-card").forEach((card) => skillObserver.observe(card));

/* ---------- Animated counters ---------- */

const animateCount = (el) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.5 }
);

$$(".stat-num").forEach((el) => counterObserver.observe(el));

/* ---------- Typing effect ---------- */

const typedEl = $("#typedText");
const phrases = [
  "predictive ML models.",
  "data pipelines that scale.",
  "NLP systems that understand.",
  "dashboards people actually use.",
];

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

const type = () => {
  const current = phrases[phraseIndex];
  charIndex += deleting ? -1 : 1;
  typedEl.textContent = current.slice(0, charIndex);

  let delay = deleting ? 40 : 75;

  if (!deleting && charIndex === current.length) {
    delay = 1900;
    deleting = true;
  } else if (deleting && charIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 350;
  }

  setTimeout(type, delay);
};

if (typedEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  type();
} else if (typedEl) {
  typedEl.textContent = phrases[0];
}

/* ---------- Contact form validation ---------- */

const form = $("#contactForm");
const status = $("#formStatus");

const validators = {
  name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name (min 2 characters)."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."),
  subject: (v) => (v.trim().length >= 4 ? "" : "Please add a short subject."),
  message: (v) => (v.trim().length >= 15 ? "" : "Message should be at least 15 characters."),
};

const validateField = (field) => {
  const message = validators[field.name](field.value);
  const fieldWrap = field.closest(".field");
  const errorEl = $(`.error[data-error-for="${field.name}"]`);

  fieldWrap.classList.toggle("invalid", Boolean(message));
  errorEl.textContent = message;
  return !message;
};

$$("#contactForm input, #contactForm textarea").forEach((field) => {
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.closest(".field").classList.contains("invalid")) validateField(field);
  });
});

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const fields = $$("#contactForm input, #contactForm textarea");
  const valid = fields.map(validateField).every(Boolean);

  if (!valid) {
    status.textContent = "Please fix the highlighted fields.";
    status.className = "form-status fail";
    return;
  }

  const btn = $("#submitBtn");
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending…";
  status.textContent = "";
  status.className = "form-status";

  setTimeout(() => {
    form.reset();
    btn.disabled = false;
    btn.textContent = original;
    status.textContent = "Thanks! Your message has been sent — I'll reply within 24 hours.";
    status.className = "form-status success";
  }, 1200);
});

/* ---------- Misc ---------- */

$("#year").textContent = new Date().getFullYear();

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu();
});
