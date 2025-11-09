import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Fitness Coach. I can help you with workout suggestions, form tips, nutrition advice, and motivation. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response (in production, this would call Lovable AI)
    setTimeout(() => {
      const responses = [
        "Great question! For better push-ups, focus on keeping your core tight and elbows at 45 degrees.",
        "I recommend starting with bodyweight squats. Keep your knees aligned with your toes and chest up.",
        "Form is everything! Let's work on proper alignment. Would you like to start a workout session?",
        "Recovery is just as important as training. Make sure you're getting enough sleep and protein.",
      ];
      const botMessage: Message = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)]
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
    
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Fitness Coach</h1>
          <p className="text-muted-foreground">Ask anything about workouts, form, nutrition, and more</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <img src={chatbotIcon} alt="AI Coach" className="w-12 h-12" />
                  <div>
                    <CardTitle>AI Fitness Coach</CardTitle>
                    <CardDescription>Powered by advanced NLP</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about exercises, form, nutrition..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend} className="bg-gradient-to-r from-primary to-accent">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Suggestions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Questions</CardTitle>
                <CardDescription>Try asking about these topics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "How do I improve my push-up form?",
                  "What's a good beginner workout?",
                  "Tips for better squat depth?",
                  "How many reps should I do?",
                  "Best exercises for core strength?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
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
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <p>Personalized workout recommendations</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <p>Form correction tips and techniques</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                  <p>Nutrition and recovery guidance</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                  <p>Motivational support 24/7</p>
                </div>
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
