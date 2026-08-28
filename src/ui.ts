import { formatYears, skills, type Skill } from "./content";

function tipEl(): HTMLElement | null {
  return document.getElementById("skill-tip");
}

export function showSkillTip(skill: Skill, x: number, y: number): void {
  const tip = tipEl();
  if (!tip) return;
  const name = tip.querySelector(".tip-name");
  const years = tip.querySelector(".tip-years");
  const blurb = tip.querySelector(".tip-blurb");
  if (name) name.textContent = skill.name;
  if (years) years.textContent = formatYears(skill.years);
  if (blurb) blurb.textContent = skill.blurb;
  tip.hidden = false;

  const pad = 12;
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  let left = x + 18;
  let top = y + 18;
  if (left + w > window.innerWidth - pad) left = x - w - 14;
  if (top + h > window.innerHeight - pad) top = y - h - 14;
  left = Math.max(pad, left);
  top = Math.max(pad, top);
  tip.style.transform = `translate(${left}px, ${top}px)`;
}

export function hideSkillTip(): void {
  const tip = tipEl();
  if (!tip || tip.hidden) return;
  tip.hidden = true;
}

function setupNav(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".site-nav a[href^='#']"),
  );

  const setCurrent = (id: string) => {
    for (const a of links) {
      if (!a.closest(".nav-list")) continue;
      const on = a.hash === `#${id}`;
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
  };

  const navMap: Record<string, string> = {
    top: "top",
    work: "work",
    profile: "profile",
    system: "system",
    contact: "contact",
  };
  const observed = ["top", "work", "profile", "system", "contact"];

  const spy = () => {
    const y = window.innerHeight * 0.34;
    let current = "top";
    for (const id of observed) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) current = navMap[id] ?? current;
    }
    setCurrent(current);
  };

  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const progress = document.querySelector<HTMLElement>(".scroll-progress");
  const setNavOpen = (open: boolean) => {
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("is-nav-open", open);
    toggle?.setAttribute("aria-expanded", open ? "true" : "false");
    if (toggle) toggle.textContent = open ? "閉じる" : "メニュー";
  };
  const closeNav = () => setNavOpen(false);
  toggle?.addEventListener("click", () => {
    setNavOpen(!nav?.classList.contains("is-open"));
  });
  for (const a of links) {
    a.addEventListener("click", closeNav);
  }
  document.addEventListener("click", (e) => {
    if (!nav?.classList.contains("is-open")) return;
    if (e.target instanceof Node && nav.contains(e.target)) return;
    closeNav();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
  const onScroll = () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 1 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = `scaleX(${t})`;
    }
    spy();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupForm(): void {
  const form = document.getElementById("contact-form");
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const done = document.createElement("p");
    done.className = "form-done";
    done.setAttribute("role", "status");
    done.textContent =
      "内容はブラウザ内で受け取りました。サーバ未接続のため、実送信はしていません。";
    form.replaceWith(done);
  });
}

function setupSkillFallback(): void {
  const ul = document.getElementById("skill-fallback");
  if (!ul) return;
  ul.replaceChildren();
  for (const s of skills) {
    const li = document.createElement("li");
    const name = document.createElement("p");
    name.className = "sf-name";
    name.textContent = s.name;
    const years = document.createElement("p");
    years.className = "sf-years";
    years.textContent = formatYears(s.years);
    const blurb = document.createElement("p");
    blurb.className = "sf-blurb";
    blurb.textContent = s.blurb;
    li.append(name, years, blurb);
    ul.append(li);
  }
}

export function initUI(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("is-static");
  }
  setupNav();
  setupForm();
  setupSkillFallback();
}
