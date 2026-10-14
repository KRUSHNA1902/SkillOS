import { useState } from "react";
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Code2,
  GraduationCap,
  Compass,
  FileText,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
} from "lucide-react";
import { AIMode, evaluateUserAnswer, AIEvaluationResponse } from "@/lib/ai-service";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  time: string;
  mode?: AIMode;
  thought?: string;
  latencySeconds?: number;
  modelName?: string;
  isStreaming?: boolean;
}

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onSaveToNotes?: (noteTitle: string, noteContent: string) => void;
  isLatestAssistant?: boolean;
}

/**
 * Helper to render markdown content with syntax-highlighted style code blocks and copy buttons
 */
function MarkdownRenderer({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  // Split into code blocks and prose
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-sm text-foreground/90 font-sans">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          const language =
            firstLineEnd > 3 ? part.slice(3, firstLineEnd).trim() : "code";
          const code = part.slice(firstLineEnd + 1, -3);

          return <CodeBlock key={index} code={code} language={language} />;
        }

        // Render formatted text blocks
        return (
          <div key={index} className="space-y-2 whitespace-pre-wrap">
            {renderFormattedText(part)}
          </div>
        );
      })}

      {isStreaming && (
        <span className="inline-block size-2 rounded-full bg-primary animate-ping ml-1 align-baseline" />
      )}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border/80 bg-neutral-100 dark:bg-[#16181d] shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 bg-neutral-200/60 dark:bg-[#1e2029] px-3.5 py-1.5 text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5 font-medium text-foreground/80 lowercase">
          <Code2 className="size-3.5 text-primary" />
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-[#171717] dark:text-[#e2e8f0]">
        <code>{code}</code>
      </div>
    </div>
  );
}

/**
 * Basic markdown text styler for bold, headers, and bullet lists
 */
function renderFormattedText(text: string) {
  const lines = text.split("\n");

  return lines.map((line, idx) => {
    // Header 1 / 2 / 3
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="font-semibold text-foreground text-base mt-3 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="font-bold text-foreground text-lg mt-4 mb-2 border-b border-border/30 pb-1">
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="font-bold text-foreground text-xl mt-5 mb-2">
          {line.replace("# ", "")}
        </h1>
      );
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletContent = line.trim().slice(2);
      return (
        <div key={idx} className="flex items-start gap-2 pl-2">
          <span className="text-primary mt-1 text-xs">•</span>
          <span>{renderInlineStyles(bulletContent)}</span>
        </div>
      );
    }

    // Horizontal rule
    if (line.trim() === "---") {
      return <hr key={idx} className="my-3 border-border/40" />;
    }

    return (
      <p key={idx} className={line.trim() === "" ? "h-2" : ""}>
        {renderInlineStyles(line)}
      </p>
    );
  });
}

function renderInlineStyles(str: string) {
  // Simple bold and inline code parser
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-primary border border-border/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function PracticeWorkspace({
  challengeText,
  onSaveToNotes,
}: {
  challengeText: string;
  onSaveToNotes?: (title: string, content: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AIEvaluationResponse | null>(null);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Check if challenge text includes a hint line
  const hintMatch = challengeText.match(/\*\*Hint:\*\*\s*([^\n\r]+)/i);
  const extractedHint = hintMatch ? hintMatch[1].trim() : null;

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateUserAnswer(challengeText, answer);
      setEvaluation(result);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopySolution = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const handleSaveNote = () => {
    if (!evaluation) return;
    const title = `Practice: ${evaluation.verdictTitle}`;
    const content = `### Challenge:\n${challengeText}\n\n### Your Submission:\n\`\`\`\n${answer}\n\`\`\`\n\n### AI Evaluation (${evaluation.score}/100 - ${evaluation.status}):\n${evaluation.feedback}\n\n### Optimal Solution:\n\`\`\`\n${evaluation.optimalSolution}\n\`\`\`\n\n${evaluation.explanation}`;
    onSaveToNotes?.(title, content);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  return (
    <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/40 space-y-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <GraduationCap className="size-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground tracking-tight block">
              Interactive Practice & Answer Check
            </span>
            <span className="text-[10px] text-muted-foreground">
              Submit your code or query below — SkillOS AI will verify correctness and explain optimal patterns.
            </span>
          </div>
        </div>
        {extractedHint && (
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono font-medium text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <HelpCircle className="size-3 text-amber-400" />
            <span>{showHint ? "Hide Hint" : "Need a Hint?"}</span>
          </button>
        )}
      </div>

      {showHint && extractedHint && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed font-sans animate-in fade-in">
          💡 <strong className="text-amber-300">Hint:</strong> {extractedHint}
        </div>
      )}

      {/* Answer Workspace Textarea */}
      <div className="space-y-2">
        <div className="relative rounded-xl border border-border/80 bg-background focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Type your SQL query, Python script, formula, or solution here..."
            className="w-full resize-y bg-transparent p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[90px]"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            {answer.length > 0 ? `${answer.length} characters` : "Supports SQL, Python, DAX & formulas"}
          </span>

          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={!answer.trim() || isEvaluating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all cursor-pointer shadow-sm"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Checking Solution...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Check My Answer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 dark:bg-[#161619] p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Header Status Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              {evaluation.status === "correct" ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>Correct! ({evaluation.score}/100)</span>
                </div>
              ) : evaluation.status === "partial" ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                  <AlertCircle className="size-3.5 text-amber-500" />
                  <span>Partially Correct ({evaluation.score}/100)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-500">
                  <AlertCircle className="size-3.5 text-rose-500" />
                  <span>Needs Revision ({evaluation.score}/100)</span>
                </div>
              )}
              <span className="text-xs font-semibold text-foreground">
                {evaluation.verdictTitle}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveNote}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {savedNote ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-500">Saved to Notes!</span>
                </>
              ) : (
                <>
                  <Bookmark className="size-3" />
                  <span>Save to Notes</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback Body */}
          <div className="text-xs text-foreground/90 leading-relaxed">
            <p>{evaluation.feedback}</p>
          </div>

          {/* Errors Identified if any */}
          {evaluation.errorsIdentified && evaluation.errorsIdentified.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs text-rose-200">
              <strong className="block text-[11px] font-semibold text-rose-300">Issues identified:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {evaluation.errorsIdentified.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimal Solution Code Block */}
          {evaluation.optimalSolution && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Optimal Canonical Solution
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySolution(evaluation.optimalSolution)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {copiedSolution ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copiedSolution ? "Copied" : "Copy Solution"}</span>
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border/80 bg-neutral-100 dark:bg-[#16181d] p-3 text-xs font-mono text-[#171717] dark:text-[#e2e8f0]">
                <code>{evaluation.optimalSolution}</code>
              </div>
            </div>
          )}

          {/* Explanation */}
          {evaluation.explanation && (
            <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-2">
              💡 {evaluation.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatMessageItem({
  message,
  onRegenerate,
  onSaveToNotes,
  isLatestAssistant,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  // Directly display content as it streams in from the API without artificial delay
  const displayedContent = message.text;
  const isStillRevealing = Boolean(!isUser && message.isStreaming);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMessageNote = () => {
    const firstLine = message.text.split("\n")[0].replace(/^[#\s*-]+/, "").slice(0, 50) || "Study Note";
    onSaveToNotes?.(firstLine, message.text);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const hasPracticeChallenge =
    !isUser &&
    !isStillRevealing &&
    (message.text.includes("Practice Challenge") || message.text.includes("🎯 Practice Challenge"));

  return (
    <div
      className={`group w-full transition-colors ${
        isUser
          ? "flex justify-end"
          : "flex flex-col items-start"
      }`}
    >
      {/* USER MESSAGE BUBBLE */}
      {isUser ? (
        <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-3xl rounded-tr-md bg-muted/70 border border-border/80 px-5 py-3.5 text-foreground shadow-sm dark:bg-[#1c1c1f] dark:border-white/10 dark:text-neutral-100">
            <p className="whitespace-pre-wrap text-sm leading-relaxed font-normal">
              {message.text}
            </p>
            <div className="mt-1 text-right text-[10px] text-muted-foreground font-mono">
              {message.time}
            </div>
          </div>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-foreground border border-border/80 mt-1 shadow-sm dark:bg-[#1c1c1f] dark:text-neutral-300 dark:border-white/10">
            <User className="size-4" />
          </div>
        </div>
      ) : (
        /* ASSISTANT MESSAGE STREAM (ChatGPT / Gemini style) */
        <div className="w-full flex items-start gap-3.5">
          {/* Glowing Avatar */}
          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-neutral-800 text-amber-400 border border-amber-500/30 shadow-sm mt-0.5">
            {message.mode === "planning" ? (
              <Compass className="size-4 text-cyan-400" />
            ) : message.mode === "notes" ? (
              <FileText className="size-4 text-emerald-400" />
            ) : (
              <Sparkles className={`size-4 ${isStillRevealing ? "animate-spin" : ""}`} />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header with Mode Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-xs tracking-tight text-foreground">
                SkillOS AI
              </span>

              {message.mode === "planning" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-500">
                  <Compass className="size-3 text-cyan-500" />
                  <span>Workflow & Plan</span>
                </span>
              )}
              {message.mode === "notes" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-500">
                  <FileText className="size-3 text-emerald-500" />
                  <span>Timeline Notes</span>
                </span>
              )}

              <span className="rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground dark:border-white/10 dark:bg-[#1c1c1f] dark:text-neutral-300">
                {message.modelName || "gemini-3.8-flash"}
              </span>
            </div>

            {/* Revealed Text Content */}
            <div className="pt-1">
              {!displayedContent && isStillRevealing ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <span className="inline-block size-2 rounded-full bg-primary animate-ping" />
                  <span>Connecting & drafting response...</span>
                </div>
              ) : (
                <MarkdownRenderer
                  content={displayedContent}
                  isStreaming={isStillRevealing}
                />
              )}
            </div>

            {/* Embedded Practice Workspace if Challenge Present */}
            {hasPracticeChallenge && (
              <PracticeWorkspace
                challengeText={message.text}
                onSaveToNotes={onSaveToNotes}
              />
            )}

            {/* Action Bar */}
            {!isStillRevealing && (
              <div className="flex items-center gap-1.5 pt-2 text-muted-foreground opacity-90 transition-opacity">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Copy response"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveMessageNote}
                  title="Save to SkillOS Notes"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  {savedNote ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Saved to Notes</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="size-3.5" />
                      <span className="text-[11px]">Save Note</span>
                    </>
                  )}
                </button>

                <div className="h-3 w-px bg-border/60 mx-1" />

                <button
                  type="button"
                  onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
                  title="Good response"
                  className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                    feedback === "up"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <ThumbsUp className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
                  title="Bad response"
                  className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                    feedback === "down"
                      ? "text-rose-400 bg-rose-500/10"
                      : "hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <ThumbsDown className="size-3.5" />
                </button>

                {isLatestAssistant && onRegenerate && (
                  <>
                    <div className="h-3 w-px bg-border/60 mx-1" />
                    <button
                      type="button"
                      onClick={onRegenerate}
                      title="Regenerate response"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
                    >
                      <RotateCw className="size-3.5" />
                      <span className="text-[11px]">Retry</span>
                    </button>
                  </>
                )}

                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  {message.time}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
