export interface Project {
  id: string;
  name: string;
  sourceLang: string;
  targetLangs: string[];
  progress: number;
  status: "active" | "completed" | "pending" | "review";
  deadline: string;
  wordCount: number;
  assignees: string[];
}

export interface TranslationSegment {
  id: number;
  source: string;
  target: string;
  status: "confirmed" | "draft" | "untranslated" | "review";
  tmMatch: number | null;
  aiConfidence: number | null;
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Marketing Website v3.2",
    sourceLang: "EN",
    targetLangs: ["DE", "FR", "ES"],
    progress: 78,
    status: "active",
    deadline: "2026-02-20",
    wordCount: 12450,
    assignees: ["Anna K.", "Michel D."],
  },
  {
    id: "2",
    name: "Mobile App Strings",
    sourceLang: "EN",
    targetLangs: ["JA", "KO", "ZH"],
    progress: 45,
    status: "active",
    deadline: "2026-02-28",
    wordCount: 8320,
    assignees: ["Yuki T.", "Chen W."],
  },
  {
    id: "3",
    name: "Legal Documents Q1",
    sourceLang: "DE",
    targetLangs: ["EN"],
    progress: 100,
    status: "completed",
    deadline: "2026-02-10",
    wordCount: 24800,
    assignees: ["Sarah M."],
  },
  {
    id: "4",
    name: "Product Manual Update",
    sourceLang: "EN",
    targetLangs: ["FR", "IT", "PT"],
    progress: 12,
    status: "pending",
    deadline: "2026-03-15",
    wordCount: 31200,
    assignees: ["Luca B.", "Maria S."],
  },
  {
    id: "5",
    name: "E-commerce Catalog",
    sourceLang: "EN",
    targetLangs: ["DE", "NL"],
    progress: 92,
    status: "review",
    deadline: "2026-02-14",
    wordCount: 6750,
    assignees: ["Hans V."],
  },
];

export const mockSegments: TranslationSegment[] = [
  {
    id: 1,
    source: "Welcome to our platform. We help businesses scale globally.",
    target: "Willkommen auf unserer Plattform. Wir helfen Unternehmen, global zu skalieren.",
    status: "confirmed",
    tmMatch: 100,
    aiConfidence: null,
  },
  {
    id: 2,
    source: "Our AI-powered tools streamline your translation workflow.",
    target: "Unsere KI-gestützten Tools optimieren Ihren Übersetzungsworkflow.",
    status: "confirmed",
    tmMatch: 87,
    aiConfidence: null,
  },
  {
    id: 3,
    source: "Get started with a free trial today and experience the difference.",
    target: "Starten Sie noch heute eine kostenlose Testversion und erleben Sie den Unterschied.",
    status: "draft",
    tmMatch: null,
    aiConfidence: 94,
  },
  {
    id: 4,
    source: "Enterprise-grade security ensures your data is always protected.",
    target: "Sicherheit auf Unternehmensniveau gewährleistet, dass Ihre Daten stets geschützt sind.",
    status: "review",
    tmMatch: 62,
    aiConfidence: 88,
  },
  {
    id: 5,
    source: "Join over 10,000 companies that trust our translation services.",
    target: "",
    status: "untranslated",
    tmMatch: null,
    aiConfidence: null,
  },
  {
    id: 6,
    source: "Our team of expert linguists reviews every translation for quality.",
    target: "",
    status: "untranslated",
    tmMatch: null,
    aiConfidence: null,
  },
  {
    id: 7,
    source: "Seamless integration with your existing content management system.",
    target: "Nahtlose Integration in Ihr bestehendes Content-Management-System.",
    status: "draft",
    tmMatch: null,
    aiConfidence: 91,
  },
  {
    id: 8,
    source: "Real-time collaboration features keep your team in sync.",
    target: "Echtzeit-Kollaborationsfunktionen halten Ihr Team synchron.",
    status: "confirmed",
    tmMatch: 95,
    aiConfidence: null,
  },
];

export const dashboardStats = {
  activeProjects: 8,
  wordsInProgress: 52420,
  tmEntries: 184320,
  avgDeliveryDays: 3.2,
};
