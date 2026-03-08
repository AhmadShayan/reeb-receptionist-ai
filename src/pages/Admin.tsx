import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi, clientsApi, contactApi, chatApi, meetingsApi, API_BASE } from "@/api/apiClient";
import type { Client, AdminStats, Meeting } from "@/api/apiClient";
import {
  Users,
  Activity,
  MessageSquare,
  Mail,
  TrendingUp,
  UserPlus,
  Trash2,
  Eye,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  User,
  CalendarDays,
  CheckCircle2,
  XCircle,
  CalendarCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
}) => (
  <Card className="border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {icon}
        </div>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </CardContent>
  </Card>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "clients" | "messages" | "chat" | "calendar";

// ─── Admin Page ───────────────────────────────────────────────────────────────

const Admin = () => {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c, m, cl, mt] = await Promise.all([
        adminApi.getStats(),
        clientsApi.list(),
        contactApi.list(),
        chatApi.getLogs(50),
        meetingsApi.list(),
      ]);
      setStats(s);
      setClients(c);
      setMessages(m);
      setChatLogs(cl);
      setMeetings(mt);
    } catch {
      setError("Cannot connect to backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteClient = async (id: number) => {
    if (!confirm("Delete this client? This also removes their face data and visit history.")) return;
    await clientsApi.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteMessage = async (id: number) => {
    await contactApi.delete(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMeetingStatus = async (id: number, status: string) => {
    const updated = await meetingsApi.updateStatus(id, status);
    setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!confirm("Delete this meeting? This cannot be undone.")) return;
    await meetingsApi.delete(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "clients", label: "Clients", icon: <Users className="w-4 h-4" /> },
    { key: "calendar", label: "Calendar", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "messages", label: "Messages", icon: <Mail className="w-4 h-4" /> },
    { key: "chat", label: "Chat Logs", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage clients, view analytics, and monitor REEB AI activity</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchAll} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <NavLink to="/register-client">
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Client
                </Button>
              </NavLink>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5 mb-6">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-600">Backend Not Connected</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit mb-8 border border-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === "clients" && clients.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary/20 text-primary border-0">
                    {clients.length}
                  </Badge>
                )}
                {t.key === "calendar" && meetings.filter((m) => m.status === "scheduled").length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-violet-500/20 text-violet-600 border-0">
                    {meetings.filter((m) => m.status === "scheduled").length}
                  </Badge>
                )}
                {t.key === "messages" && messages.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500/20 text-orange-600 border-0">
                    {messages.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {loading && !stats && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {tab === "overview" && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Registered Clients" value={stats.total_clients} icon={<Users className="w-5 h-5" />} />
                <StatCard title="Total Visits" value={stats.total_visits} icon={<Activity className="w-5 h-5" />} sub={`${stats.visits_last_7_days} this week`} />
                <StatCard title="Chat Messages" value={stats.total_chat_messages} icon={<MessageSquare className="w-5 h-5" />} />
                <StatCard title="Contact Inquiries" value={stats.total_contact_messages} icon={<Mail className="w-5 h-5" />} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Visitors */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Most Frequent Visitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.top_visitors.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No visit data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.top_visitors.map((v, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {i + 1}
                            </div>
                            <span className="flex-1 text-sm font-medium">{v.name}</span>
                            <Badge variant="secondary">{v.visits} visits</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recent_activity.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No recent activity.</p>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto">
                        {stats.recent_activity.map((a, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{a.client_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {a.notes} · {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── CLIENTS TAB ──────────────────────────────────────────────── */}
          {tab === "clients" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-sm">{clients.length} registered client(s)</p>
                <NavLink to="/register-client">
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </NavLink>
              </div>
              {clients.length === 0 ? (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="font-medium text-muted-foreground">No clients registered yet.</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Register a client with their photo to enable face recognition.</p>
                    <NavLink to="/register-client">
                      <Button>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register First Client
                      </Button>
                    </NavLink>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <Card key={client.id} className="border-border hover:shadow-glow transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          {client.photo_path ? (
                            <img
                              src={`${API_BASE}${client.photo_path}`}
                              alt={client.name}
                              className="w-12 h-12 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{client.name}</p>
                              {client.has_face && (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs shrink-0">
                                  Face ✓
                                </Badge>
                              )}
                            </div>
                            {client.department && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" />
                                {client.department}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground mb-3">
                          {client.email && <p className="truncate">✉ {client.email}</p>}
                          {client.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </p>
                          )}
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {client.visit_count ?? 0} visit(s)
                            {client.last_visit && ` · Last: ${new Date(client.last_visit).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <NavLink to={`/register-client?edit=${client.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </NavLink>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CALENDAR TAB ─────────────────────────────────────────────── */}
          {tab === "calendar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {meetings.filter((m) => m.status === "scheduled").length} upcoming ·{" "}
                  {meetings.length} total
                </p>
              </div>

              {meetings.length === 0 ? (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="font-medium text-muted-foreground">No meetings scheduled yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visitors can schedule meetings through the AI chat on the Demo page.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {meetings.map((m) => {
                    const statusColor =
                      m.status === "scheduled"
                        ? "bg-violet-500/20 text-violet-600 border-violet-500/30"
                        : m.status === "completed"
                        ? "bg-green-500/20 text-green-600 border-green-500/30"
                        : "bg-red-500/20 text-red-500 border-red-500/30";

                    return (
                      <Card key={m.id} className={`border-border ${m.status === "cancelled" ? "opacity-60" : ""}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <CalendarCheck className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-sm">{m.client_name}</span>
                                  <span className="text-muted-foreground text-xs">→</span>
                                  <span className="font-semibold text-sm text-primary">{m.host_name}</span>
                                  <Badge className={`text-xs ml-auto ${statusColor}`}>
                                    {m.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {m.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {m.time} · {m.duration} min
                                  </span>
                                  {m.client_email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {m.client_email}
                                    </span>
                                  )}
                                </div>
                                {m.purpose && (
                                  <p className="text-xs text-foreground bg-secondary/40 rounded-md px-2 py-1 mt-2 inline-block">
                                    {m.purpose}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {m.status === "scheduled" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-500/10 border-green-500/30"
                                    onClick={() => handleMeetingStatus(m.id, "completed")}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Done
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
                                    onClick={() => handleMeetingStatus(m.id, "cancelled")}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500"
                                onClick={() => handleDeleteMeeting(m.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES TAB ─────────────────────────────────────────────── */}
          {tab === "messages" && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">{messages.length} inquiry/inquiries received</p>
              {messages.length === 0 ? (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">No contact messages yet.</p>
                  </CardContent>
                </Card>
              ) : (
                messages.map((m) => (
                  <Card key={m.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">{m.name}</span>
                            {m.company && <Badge variant="secondary" className="text-xs">{m.company}</Badge>}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                            </span>
                          </div>
                          <p className="text-sm text-primary mb-2">{m.email}</p>
                          <p className="text-sm text-foreground bg-secondary/40 rounded-lg p-3">{m.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-500 flex-shrink-0"
                          onClick={() => handleDeleteMessage(m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── CHAT LOGS TAB ────────────────────────────────────────────── */}
          {tab === "chat" && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">{chatLogs.length} message(s) logged</p>
              {chatLogs.length === 0 ? (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">No chat activity yet. Start a conversation on the Demo page.</p>
                  </CardContent>
                </Card>
              ) : (
                chatLogs.map((log) => (
                  <Card key={log.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {log.client_name ?? "Anonymous"}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground shrink-0">Visitor:</span>
                          <span className="text-foreground">{log.user_message}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-primary shrink-0">REEB:</span>
                          <span className="text-foreground">{log.ai_response}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
