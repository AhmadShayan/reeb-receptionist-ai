import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recognitionApi, chatApi, API_BASE } from "@/api/apiClient";
import type { RecognitionResult } from "@/api/apiClient";
import {
  Camera,
  CameraOff,
  Send,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Scan,
  RefreshCw,
  Clock,
  Building2,
  Mic,
  MicOff,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

// ─── Demo Page ──────────────────────────────────────────────────────────────

const Demo = () => {
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Recognition state
  const [scanning, setScanning] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ─── Load face-api.js models ──────────────────────────────────────────────

  const loadModels = useCallback(async () => {
    if (modelsLoaded || modelsLoading) return;
    setModelsLoading(true);
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load face-api models:", err);
      setCameraError("Failed to load face recognition models. Please refresh.");
    } finally {
      setModelsLoading(false);
    }
  }, [modelsLoaded, modelsLoading]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // ─── Scroll chat to bottom ────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Start camera ─────────────────────────────────────────────────────────

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      // Set state first so the video element is visible, then attach stream
      setRecognitionResult(null);
      setCapturedImage(null);
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        "Camera access denied. Please allow camera permissions and try again."
      );
    }
  };

  // Attach stream to video element after cameraActive flips to true
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraActive]);

  // ─── Stop camera ─────────────────────────────────────────────────────────

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
  };

  // ─── Live face detection feedback (runs continuously) ─────────────────────

  useEffect(() => {
    if (!cameraActive || !modelsLoaded) return;
    let animFrame: number;

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrame = requestAnimationFrame(detect);
        return;
      }
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })
      );
      setFaceDetected(!!detection);
      animFrame = requestAnimationFrame(detect);
    };

    animFrame = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animFrame);
  }, [cameraActive, modelsLoaded]);

  // ─── Capture & Recognize ──────────────────────────────────────────────────

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
    setScanning(true);
    setRecognitionResult(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageDataUrl);

      // Compute full face descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setRecognitionResult({ matched: false, reason: "No face detected in frame. Please look directly at the camera." });
        setScanning(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const result = await recognitionApi.recognize(descriptor, true);
      setRecognitionResult(result);

      // Trigger greeting message in chat
      if (result.matched && result.client) {
        const greeting = await chatApi.getGreeting(
          result.client.id,
          result.client.visit_count ?? 0,
          result.client.last_visit ?? undefined
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: greeting.greeting,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Welcome! I couldn't identify you in our system. You can still chat with me, or visit the admin panel to register.",
            timestamp: new Date(),
          },
        ]);
      }

      stopCamera();
    } catch (err) {
      console.error("Recognition error:", err);
      setRecognitionResult({
        matched: false,
        reason: "Backend not connected. Start the backend server and try again.",
      });
    } finally {
      setScanning(false);
    }
  };

  // ─── Reset scan ───────────────────────────────────────────────────────────

  const handleReset = () => {
    setRecognitionResult(null);
    setCapturedImage(null);
    setFaceDetected(false);
    startCamera();
  };

  // ─── Chat ─────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text, timestamp: new Date() },
    ]);
    setInputText("");
    setChatLoading(true);

    try {
      const clientId = recognitionResult?.matched ? recognitionResult.client?.id : null;
      const response = await chatApi.send(text, clientId, sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm having trouble connecting to the server. Please make sure the backend is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Initial greeting ──────────────────────────────────────────────────────

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text: "Welcome to Agentic REEB AI! I'm REEB, your intelligent AI receptionist. Please use the camera to identify yourself, or just start chatting with me below.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
              Live Demo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              REEB AI Receptionist
              <span className="block bg-gradient-hero bg-clip-text text-transparent text-3xl md:text-4xl mt-1">
                Face Recognition + AI Chat
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Step in front of the camera to be identified, then chat with REEB — your intelligent AI receptionist.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* ── LEFT: Camera & Recognition ─────────────────────────────── */}
            <div className="space-y-4">
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scan className="w-5 h-5 text-primary" />
                    Face Recognition
                    {modelsLoading && (
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading AI models…
                      </span>
                    )}
                    {modelsLoaded && !modelsLoading && (
                      <span className="text-xs text-green-500 ml-auto flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Models ready
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Video feed */}
                  <div className="relative bg-black aspect-video">
                    {/* Video element always in DOM so ref is always available */}
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                      muted
                      autoPlay
                      playsInline
                    />

                    {/* Captured image (shown after scan) */}
                    {capturedImage && !cameraActive && (
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Idle placeholder */}
                    {!cameraActive && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-3">
                        <CameraOff className="w-16 h-16" />
                        <p className="text-sm">Camera inactive</p>
                        {cameraError && (
                          <p className="text-red-400 text-xs text-center px-4">{cameraError}</p>
                        )}
                      </div>
                    )}

                    {/* Face detection indicator (only when camera active) */}
                    {cameraActive && (
                      <div
                        className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-colors ${
                          faceDetected
                            ? "bg-green-500/80 text-white"
                            : "bg-yellow-500/80 text-black"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full animate-pulse ${faceDetected ? "bg-white" : "bg-black"}`} />
                        {faceDetected ? "Face Detected" : "No Face"}
                      </div>
                    )}

                    {/* Scanning overlay */}
                    {scanning && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                        <p className="text-white font-semibold">Analyzing…</p>
                        <p className="text-white/70 text-sm">Running face recognition</p>
                      </div>
                    )}

                    {/* Scan frame corners (only when camera active) */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className={`w-48 h-56 border-2 rounded-lg transition-colors ${faceDetected ? "border-green-400" : "border-white/30"}`}>
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                        </div>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Camera controls */}
                  <div className="p-4 space-y-3">
                    {!cameraActive && !capturedImage && (
                      <Button
                        onClick={startCamera}
                        className="w-full"
                        disabled={modelsLoading}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {modelsLoading ? "Loading AI Models…" : "Start Camera"}
                      </Button>
                    )}
                    {cameraActive && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCapture}
                          className="flex-1"
                          disabled={scanning || !faceDetected}
                        >
                          {scanning ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Scan className="w-4 h-4 mr-2" />
                          )}
                          {scanning ? "Scanning…" : faceDetected ? "Identify Me" : "Position Your Face"}
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          <CameraOff className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {capturedImage && (
                      <Button variant="outline" onClick={handleReset} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Scan Again
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recognition Result Card */}
              {recognitionResult && (
                <Card
                  className={`border-2 ${
                    recognitionResult.matched
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-orange-500/50 bg-orange-500/5"
                  }`}
                >
                  <CardContent className="p-5">
                    {recognitionResult.matched && recognitionResult.client ? (
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {recognitionResult.client.photo_path ? (
                            <img
                              src={`${API_BASE}${recognitionResult.client.photo_path}`}
                              alt={recognitionResult.client.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-green-400">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <CheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-green-500 bg-background rounded-full" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{recognitionResult.client.name}</h3>
                            <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                              {recognitionResult.confidence}% match
                            </Badge>
                          </div>
                          {recognitionResult.client.department && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {recognitionResult.client.department}
                              {recognitionResult.client.company && ` · ${recognitionResult.client.company}`}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {recognitionResult.client.visit_count ?? 0} visits
                            </span>
                            {recognitionResult.client.last_visit && (
                              <span>
                                Last: {new Date(recognitionResult.client.last_visit).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Visitor Not Recognized</p>
                          <p className="text-sm text-muted-foreground">
                            {recognitionResult.reason ?? "No match found in database."}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── RIGHT: Chat Interface ──────────────────────────────────── */}
            <Card className="border-border flex flex-col h-[600px]">
              <CardHeader className="pb-3 border-b border-border flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Chat with REEB
                  {recognitionResult?.matched && recognitionResult.client && (
                    <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-xs">
                      Logged in as {recognitionResult.client.name}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                        <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) =>
                        /^https?:\/\//.test(part)
                          ? <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all">{part}</a>
                          : part
                      )}</p>
                      <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0 mr-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening…" : "Type or speak your message…"}
                    disabled={chatLoading}
                    className={`flex-1 ${isListening ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  <Button
                    onClick={toggleVoiceInput}
                    disabled={chatLoading}
                    size="icon"
                    variant={isListening ? "destructive" : "outline"}
                    title={isListening ? "Stop listening" : "Speak"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || chatLoading}
                    size="icon"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Try: "I have a meeting with Mian" · "Where are the restrooms?" · "I need IT support"
                </p>
              </div>
            </Card>
          </div>

          {/* Info section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: <Scan className="w-6 h-6" />,
                title: "Real Face Recognition",
                desc: "face-api.js computes 128D face embeddings locally in your browser and matches against registered clients in the database.",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Intelligent AI Chat",
                desc: "REEB handles visitor queries, meeting notifications, directions, and more — personalized with your name once recognized.",
              },
              {
                icon: <User className="w-6 h-6" />,
                title: "Register Clients",
                desc: "Admins can register clients with a photo to enable face recognition. Visit the Admin panel to manage clients.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-secondary/30 border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mx-auto mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Demo;
