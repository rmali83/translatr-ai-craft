import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QAIssue {
  type: "grammar" | "terminology" | "consistency" | "style" | "accuracy";
  severity: "error" | "warning" | "info";
  message: string;
  suggestion: string;
}

export interface TranslationResult {
  translation: string;
  confidence: number;
  alternatives: { text: string; confidence: number }[];
}

export interface QAResult {
  score: number;
  issues: QAIssue[];
  riskLevel: "low" | "medium" | "high";
}

export interface RiskResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: { factor: string; impact: string; detail: string }[];
  recommendation: string;
}

export interface RewriteResult {
  rewritten: string;
  changes: string[];
}

export interface TerminologyResult {
  compliant: boolean;
  violations: { term: string; expected: string; found: string; suggestion: string }[];
}

async function callAI(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ai-translate", { body });
  if (error) throw error;
  return data;
}

export function useAITranslation() {
  const [loading, setLoading] = useState<string | null>(null);

  const translate = useCallback(async (source: string, sourceLang = "EN", targetLang = "DE", glossary?: { en: string; de: string }[]) => {
    setLoading("translate");
    try {
      const result = await callAI({ action: "translate", source, sourceLang, targetLang, glossary });
      return result as TranslationResult;
    } finally {
      setLoading(null);
    }
  }, []);

  const qaCheck = useCallback(async (source: string, target: string, glossary?: { en: string; de: string }[]) => {
    setLoading("qa");
    try {
      const result = await callAI({ action: "qa_check", source, target, glossary });
      return result as QAResult;
    } finally {
      setLoading(null);
    }
  }, []);

  const riskScore = useCallback(async (source: string, target: string) => {
    setLoading("risk");
    try {
      const result = await callAI({ action: "risk_score", source, target });
      return result as RiskResult;
    } finally {
      setLoading(null);
    }
  }, []);

  const rewrite = useCallback(async (source: string, target: string) => {
    setLoading("rewrite");
    try {
      const result = await callAI({ action: "rewrite", source, target });
      return result as RewriteResult;
    } finally {
      setLoading(null);
    }
  }, []);

  const terminologyCheck = useCallback(async (source: string, target: string, glossary: { en: string; de: string }[]) => {
    setLoading("terminology");
    try {
      const result = await callAI({ action: "terminology_check", source, target, glossary });
      return result as TerminologyResult;
    } finally {
      setLoading(null);
    }
  }, []);

  return { translate, qaCheck, riskScore, rewrite, terminologyCheck, loading };
}
