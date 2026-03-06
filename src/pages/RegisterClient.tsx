import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as faceapi from "@vladmandic/face-api";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientsApi, API_BASE } from "@/api/apiClient";
import {
  Camera,
  CameraOff,
  UserPlus,
  CheckCircle,
  Loader2,
  Upload,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  User,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useToast } from "@/hooks/use-toast";

const RegisterClient = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");

  // Camera / photo state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [processingFace, setProcessingFace] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  // Load models
  const loadModels = useCallback(async () => {
    if (modelsLoaded || modelsLoading) return;
    setModelsLoading(true);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load models:", err);
    } finally {
      setModelsLoading(false);
    }
  }, [modelsLoaded, modelsLoading]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Load existing client for editing
  useEffect(() => {
    if (!editId) return;
    clientsApi.get(Number(editId)).then((client) => {
      setName(client.name);
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setDepartment(client.department ?? "");
      setCompany(client.company ?? "");
      if (client.photo_path) {
        setExistingPhoto(`${API_BASE}${client.photo_path}`);
      }
    }).catch(() => {
      toast({ title: "Client not found", variant: "destructive" });
    });
  }, [editId]);

  // Live face detection
  useEffect(() => {
    if (!cameraActive || !modelsLoaded) return;
    let animFrame: number;
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrame = requestAnimationFrame(detect);
        return;
      }
      const det = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })
      );
      setFaceDetected(!!det);
      animFrame = requestAnimationFrame(detect);
    };
    animFrame = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animFrame);
  }, [cameraActive, modelsLoaded]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      setCapturedImage(null);
      setCapturedBlob(null);
      setFaceDescriptor(null);
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  };

  // Attach stream after video element is guaranteed in DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraActive]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setFaceDetected(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
    setProcessingFace(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);

      // Compute face descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast({
          title: "No face detected",
          description: "Please position your face in the frame and try again.",
          variant: "destructive",
        });
        setCapturedImage(null);
        setProcessingFace(false);
        return;
      }

      setFaceDescriptor(Array.from(detection.descriptor));

      // Convert canvas to Blob for upload
      canvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, "image/jpeg", 0.85);

      stopCamera();
      toast({ title: "Face captured!", description: "Face descriptor computed successfully." });
    } finally {
      setProcessingFace(false);
    }
  };

  // Upload from file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modelsLoaded) return;
    setProcessingFace(true);
    try {
      const dataUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      setCapturedImage(dataUrl);
      setCapturedBlob(file);

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDescriptor(Array.from(detection.descriptor));
        toast({ title: "Face extracted!", description: "Face descriptor computed from photo." });
      } else {
        setFaceDescriptor(null);
        toast({
          title: "Face not detected in photo",
          description: "The system will save the photo, but face recognition won't work for this client.",
        });
      }
    } finally {
      setProcessingFace(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("department", department);
      formData.append("company", company);
      formData.append("face_descriptor", faceDescriptor ? JSON.stringify(faceDescriptor) : "");

      if (capturedBlob) {
        formData.append("photo", capturedBlob, "photo.jpg");
      }

      if (editId) {
        await clientsApi.update(Number(editId), formData);
        toast({ title: "Client updated successfully!" });
      } else {
        await clientsApi.create(formData);
        toast({ title: "Client registered!", description: `${name} has been added to the system.` });
      }

      setSuccess(true);
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      toast({
        title: "Failed to save client",
        description: "Make sure the backend server is running.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <NavLink to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </NavLink>
            <div>
              <h1 className="text-2xl font-bold">{editId ? "Edit Client" : "Register New Client"}</h1>
              <p className="text-sm text-muted-foreground">
                {editId ? "Update client details and face data" : "Add a client with their face photo to enable recognition"}
              </p>
            </div>
          </div>

          {success ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Client {editId ? "Updated" : "Registered"}!</h2>
                <p className="text-muted-foreground">Redirecting to admin dashboard…</p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Client Details */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Client Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ahmed Hassan"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering, HR, Finance"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company / Organization</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. TechCorp Ltd"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Face Photo */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Face Photo
                      {modelsLoading && (
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading…
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Preview */}
                    <div className="relative bg-secondary/30 rounded-xl overflow-hidden aspect-video mb-4">
                      {/* Video always in DOM so ref is always valid */}
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                        muted
                        autoPlay
                        playsInline
                      />
                      {cameraActive && (
                        <>
                          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${faceDetected ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"}`}>
                            {faceDetected ? "Face Detected" : "No Face"}
                          </div>
                          {processingFace && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                          )}
                        </>
                      )}
                      {!cameraActive && capturedImage && (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                      )}
                      {!cameraActive && !capturedImage && existingPhoto && (
                        <img src={existingPhoto} alt="Existing" className="w-full h-full object-cover" />
                      )}
                      {!cameraActive && !capturedImage && !existingPhoto && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <Camera className="w-12 h-12 opacity-30" />
                          <p className="text-sm">No photo yet</p>
                        </div>
                      )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face status */}
                    {faceDescriptor && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          128D face descriptor computed — recognition enabled
                        </span>
                      </div>
                    )}
                    {capturedImage && !faceDescriptor && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600">Photo saved but no face detected</span>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="space-y-2">
                      {!cameraActive && (
                        <>
                          <Button
                            type="button"
                            onClick={startCamera}
                            variant="outline"
                            className="w-full"
                            disabled={modelsLoading}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {modelsLoading ? "Loading Models…" : "Use Camera"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={modelsLoading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          {capturedImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-muted-foreground"
                              onClick={() => {
                                setCapturedImage(null);
                                setCapturedBlob(null);
                                setFaceDescriptor(null);
                              }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Clear photo
                            </Button>
                          )}
                        </>
                      )}
                      {cameraActive && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1"
                            disabled={!faceDetected || processingFace}
                          >
                            {processingFace ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4 mr-2" />
                            )}
                            {processingFace ? "Processing…" : "Capture"}
                          </Button>
                          <Button type="button" variant="outline" onClick={stopCamera}>
                            <CameraOff className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submit */}
              <div className="mt-6 flex gap-3 justify-end">
                <NavLink to="/admin">
                  <Button type="button" variant="outline">Cancel</Button>
                </NavLink>
                <Button type="submit" disabled={submitting || !name.trim()}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {editId ? "Update Client" : "Register Client"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterClient;
