export const person = {
  name: "Tonosaki Seinosuke",
  age: 25,
  location: "千葉県",
  job: "ソフトウェアエンジニア",
  years: 4,
  oneLine: "TypeScript と Python を軸に、フロントからバックエンドまで設計する",
  joke: "自称アニメ評論家",
  email: "tonosaki914@icloud.com",
  x: {
    url: "https://x.com/tonosaki914",
    handle: "@tonosaki914",
  },
  github: {
    url: "https://github.com/seino914",
    handle: "seino914",
  },
  qiita: {
    url: "https://qiita.com/tonosaki914",
    handle: "tonosaki914",
  },
  site: "https://tonosaki-tech.com/",
} as const;

export const specialties = [
  {
    title: "バックエンド",
    body: "TypeScript（Node.js、NestJS）、Python（FastAPI）",
  },
  {
    title: "高性能Web",
    body: "速度、データベース設計、セキュリティ",
  },
  {
    title: "ソリューション設計",
    body: "要件から実装まで、デザインパターンで組み立てる",
  },
] as const;

export type SkillGroup = "front" | "back" | "tools";

export type Skill = {
  id: string;
  name: string;
  years: number;
  blurb: string;
  group: SkillGroup;
  atlas: string;
};

export const skills: Skill[] = [
  {
    id: "typescript",
    name: "TypeScript",
    years: 2.5,
    blurb: "型を先に置く",
    group: "front",
    atlas: "TypeScript",
  },
  {
    id: "javascript",
    name: "JavaScript",
    years: 3.5,
    blurb: "ブラウザとNodeの土台",
    group: "front",
    atlas: "JavaScript",
  },
  {
    id: "react",
    name: "React",
    years: 2.5,
    blurb:
      "Hooks、状態管理、パフォーマンス。Next.js の SSR/SSG/ISR/CSR、App Router、API Routes、Server Actions",
    group: "front",
    atlas: "React",
  },
  {
    id: "astro",
    name: "Astro",
    years: 0.5,
    blurb: "静的に寄せるときに使う",
    group: "front",
    atlas: "Astro",
  },
  {
    id: "html-css",
    name: "HTML / CSS",
    years: 3.5,
    blurb: "Tailwind、Panda CSS",
    group: "front",
    atlas: "HTML / CSS",
  },
  {
    id: "nestjs",
    name: "NestJS",
    years: 0.5,
    blurb: "TypeScriptのサーバー",
    group: "back",
    atlas: "NestJS",
  },
  {
    id: "nodejs",
    name: "Node.js",
    years: 1.5,
    blurb: "ランタイム",
    group: "back",
    atlas: "Node.js",
  },
  {
    id: "python",
    name: "Python",
    years: 1.5,
    blurb: "もう一本の軸",
    group: "back",
    atlas: "Python",
  },
  {
    id: "fastapi",
    name: "FastAPI",
    years: 0.5,
    blurb: "Pythonのサーバー",
    group: "back",
    atlas: "FastAPI",
  },
  {
    id: "sql",
    name: "SQL",
    years: 1.5,
    blurb: "PostgreSQL、MySQL、SQLite、Oracle、SQLAlchemy、Prisma、Drizzle",
    group: "back",
    atlas: "SQL",
  },
  {
    id: "git",
    name: "Git / GitHub",
    years: 3,
    blurb: "履歴を残す",
    group: "tools",
    atlas: "Git",
  },
  {
    id: "vscode",
    name: "VSCode / Cursor",
    years: 3.5,
    blurb: "日常の編集器",
    group: "tools",
    atlas: "VSCode",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    years: 0.5,
    blurb: "実装の補助",
    group: "tools",
    atlas: "Claude",
  },
  {
    id: "figma",
    name: "Figma",
    years: 1,
    blurb: "画面の受け渡し",
    group: "tools",
    atlas: "Figma",
  },
];

export const atlasMarks = [
  "TS",
  "<>",
  "{ }",
  "Next.js",
  "Prisma",
  "Drizzle",
  "HTML",
  "CSS",
  "Node",
  "Git",
] as const;

export type Work = {
  index: string;
  name: string;
  body: string;
  tags: string;
  url: string;
};

export const works: Work[] = [
  {
    index: "01",
    name: "tonosaki-tech.com",
    body: "現行ポートフォリオ。Next.js App Router で経歴と技術を置いている。",
    tags: "Next.js / TypeScript / Tailwind",
    url: "https://tonosaki-tech.com/",
  },
  {
    index: "02",
    name: "seino914 / portfolio",
    body: "その実装。About、Skills、Contact まで含めたソース。",
    tags: "TypeScript / React / Next.js",
    url: "https://github.com/seino914/portfolio",
  },
  {
    index: "03",
    name: "seino914 / dotfiles",
    body: "開発環境を Nix で宣言する。再現できる作業場。",
    tags: "Nix / zsh / VSCode",
    url: "https://github.com/seino914/dotfiles",
  },
];

export const VOID = "#100816";
export const PAPER = "#2a1b3d";
export const INK = "#f6f1ff";
export const VIOLET = "#c4a6ff";

export function formatYears(years: number): string {
  return `${years}年`;
}

export function skillsByGroup(group: SkillGroup): Skill[] {
  return skills.filter((s) => s.group === group);
}
