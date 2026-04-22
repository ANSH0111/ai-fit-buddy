// src/pages/ChatbotPage.tsx
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Volume2, VolumeX, Loader2, Mic } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import chatbotIcon from "@/assets/chatbot-icon.png";
import { getRuleBasedResponse, getGroqResponse, type GroqMessage } from "@/lib/chatbot";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

const QUICK_QUESTIONS = [
  "How do I improve my squat form?",
  "Best beginner workout plan?",
  "Tips for perfect push-ups?",
  "How much protein do I need?",
  "How to do a proper plank?",
  "I feel like giving up today",
];

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! 👋 I'm your AI Fitness Coach. Ask me about exercise form, workouts, nutrition, or anything fitness-related. I'm here to help! 💪",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { enabled, supported, speak, toggle } = useVoiceFeedback();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak bot messages when they arrive
  const speakResponse = (text: string) => {
    // Strip emojis for cleaner TTS
    const clean = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, "").trim();
    speak(clean, { priority: true });
  };

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    const userMessage: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add loading placeholder
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isLoading: true },
    ]);

    try {
      // 1. Try rule-based first (instant)
      const ruleResponse = getRuleBasedResponse(userText);

      if (ruleResponse) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: ruleResponse },
        ]);
        speakResponse(ruleResponse);
      } else {
        // 2. Fall back to Groq API
        const history: GroqMessage[] = messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content }));
        history.push({ role: "user", content: userText });

        const groqResponse = await getGroqResponse(history);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: groqResponse },
        ]);
        speakResponse(groqResponse);
      }
    } catch (error) {
      const errMsg =
        "Sorry, I had trouble connecting. Check your API key in .env or try again. 🔌";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: errMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Optional: Voice input using Web Speech API
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => alert("Could not hear you. Try again.");
    recognition.start();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">AI Fitness Coach</h1>
            <p className="text-muted-foreground">
              Ask anything about workouts, form, nutrition, and more
            </p>
          </div>
          {supported && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggle}
              title={enabled ? "Disable voice" : "Enable voice"}
            >
              {enabled ? (
                <Volume2 className="w-4 h-4 mr-2" />
              ) : (
                <VolumeX className="w-4 h-4 mr-2" />
              )}
              {enabled ? "Voice On" : "Voice Off"}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Chat Interface ── */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <img src={chatbotIcon} alt="AI Coach" className="w-12 h-12" />
                  <div>
                    <CardTitle>AI Fitness Coach</CardTitle>
                    <CardDescription>
                      Powered by Groq · llama3-8b-8192
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={startVoiceInput}
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Ask about exercises, form, nutrition..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Questions</CardTitle>
                <CardDescription>Tap to ask instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { color: "bg-primary", text: "Real AI responses via Groq" },
                  { color: "bg-accent", text: "Voice output (Web TTS)" },
                  { color: "bg-green-500", text: "Voice input (mic button)" },
                  { color: "bg-yellow-500", text: "Instant rule-based answers" },
                  { color: "bg-purple-500", text: "Conversation history context" },
                ].map(({ color, text }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${color} mt-2`} />
                    <p>{text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChatbotPage;