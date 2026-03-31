"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, Calendar, User, Bed, Phone, Mail, CheckCircle, Info, UserPlus, Pencil, ChevronLeft, ChevronRight, FileText, Receipt } from "lucide-react";

type Gast = {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer: string;
  strasse: string;
  hausnummer: string;
  postleitzahl: string;
  stadt: string;
  land: string;
};

type Reservierung = {
  id: number;
  gast_id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer: string;
  strasse: string;
  hausnummer: string;
  postleitzahl: string;
  stadt: string;
  land: string;
  zimmer_id: number;
  zimmer_nummer: number;
  zimmer_preis: number;
  check_in_datum: string;
  check_out_datum: string;
  status_id: number;
  status: string;
  fruehstueck: boolean;
  parkplatz: boolean;
  bemerkung: string;
  mitreisende?: Mitreisender[];
};

type Mitreisender = {
  id?: number;
  reservierung_id?: number;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
};

type StatusOption = {
  id: number;
  name: string;
};

type Zimmer = {
  id: number;
  nummer: number;
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reservations");
  const [isResOpen, setIsResOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservierung | null>(null);
  const [isEditingRes, setIsEditingRes] = useState(false);
  const [tempStatusId, setTempStatusId] = useState<string>("");
  const [editingGuest, setEditingGuest] = useState<Gast | null>(null);
  const [guestHistory, setGuestHistory] = useState<Gast | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const prevWeek = () => setCurrentWeekStart(prev => {
    const d = new Date(prev);
    d.setDate(d.getDate() - 7);
    return d;
  });

  const nextWeek = () => setCurrentWeekStart(prev => {
    const d = new Date(prev);
    d.setDate(d.getDate() + 7);
    return d;
  });

  const resetToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const weekDisplay = `${currentWeekStart.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit' })} – ${weekEnd.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  const { data: gäste = [] } = useQuery({
    queryKey: ["gäste"],
    queryFn: () => executeQuery<Gast[]>("SELECT * FROM Gast ORDER BY nachname ASC, vorname ASC"),
  });

  const { data: statusOptionen = [] } = useQuery({
    queryKey: ["status_optionen"],
    queryFn: () => executeQuery<StatusOption[]>("SELECT id, name FROM Status ORDER BY id ASC"),
  });

  const { data: reservierungen = [] } = useQuery({
    queryKey: ["reservierungen"],
    queryFn: () =>
      executeQuery<Reservierung[]>(
        `SELECT r.id, r.start as check_in_datum, r.ende as check_out_datum, r.status_id, r.gast_id, r.zimmer_id,
                r.fruehstueck, r.parkplatz, r.bemerkung,
                g.vorname, g.nachname, g.email, g.telefonnummer, g.strasse, g.hausnummer, g.postleitzahl, g.stadt, g.land,
                z.nummer as zimmer_nummer, k.preis as zimmer_preis, s.name as status
         FROM Reservierung r 
         JOIN Gast g ON r.gast_id = g.id 
         JOIN zimmer z ON r.zimmer_id = z.id 
         JOIN Kategorie k ON z.kategorie_id = k.id
         LEFT JOIN Status s ON r.status_id = s.id
         ORDER BY r.start DESC`
      ),
  });

  const { data: zimmer = [] } = useQuery({
    queryKey: ["zimmer_lite"],
    queryFn: () => executeQuery<Zimmer[]>("SELECT id, nummer FROM zimmer WHERE aktiv = true ORDER BY nummer ASC"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, statusId }: { id: number, statusId: number }) =>
      executeQuery(`UPDATE Reservierung SET status_id = ${statusId} WHERE id = ${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservierungen"] });
    },
  });

  const deleteRes = useMutation({
    mutationFn: (id: number) => executeQuery(`DELETE FROM Reservierung WHERE id = ${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservierungen"] }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Anfrage': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      case 'Bestätigt': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      case 'Storniert': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      case 'Check-in erfolgt': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200';
      case 'Abgereist': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const deleteGuest = useMutation({
    mutationFn: async (id: number) => {
      const res = await executeQuery<any[]>(`SELECT id FROM Reservierung WHERE gast_id = ${id}`);
      if (res.length > 0) throw new Error("Gast hat noch aktive Reservierungen!");
      await executeQuery(`DELETE FROM Gast WHERE id = ${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gäste"] }),
    onError: (err: any) => alert(err.message),
  });

  const filteredReservierungen = reservierungen.filter(res => {
    const checkIn = new Date(res.check_in_datum);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(res.check_out_datum);
    checkOut.setHours(23, 59, 59, 999);
    const matchesWeek = checkIn <= weekEnd && checkOut >= currentWeekStart;
    const matchesStatus = filterStatus === "all" || res.status_id?.toString() === filterStatus;
    return matchesWeek && matchesStatus;
  });

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <header className="h-16 flex items-center justify-between px-8 border-b bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Buchung & Gäste</h1>
      </header>

      <div className="p-8 overflow-auto flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-auto">
              <TabsTrigger value="reservations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-6 py-2">Reservierungen</TabsTrigger>
              <TabsTrigger value="guests" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-6 py-2">Gäste-Stamm</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === "reservations" ? (
                <Dialog open={isResOpen} onOpenChange={setIsResOpen}>
                  <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" />}>
                    <Calendar className="w-4 h-4 mr-2" /> Neue Buchung
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Neue Reservierung anlegen</DialogTitle>
                    </DialogHeader>
                    <ReservationForm
                      gäste={gäste}
                      zimmer={zimmer}
                      onSave={() => {
                        setIsResOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["reservierungen"] });
                        queryClient.invalidateQueries({ queryKey: ["gäste"] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={isGuestOpen} onOpenChange={setIsGuestOpen}>
                  <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" />}>
                    <UserPlus className="w-4 h-4 mr-2" /> Gast hinzufügen
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Neuen Gast anlegen</DialogTitle>
                    </DialogHeader>
                    <GuestForm
                      onSave={() => {
                        setIsGuestOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["gäste"] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <TabsContent value="reservations" className="m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={prevWeek} className="h-8 w-8 p-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextWeek} className="h-8 w-8 p-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-44 text-center">
                    {weekDisplay}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" onClick={resetToCurrentWeek}>
                  Aktuelle Woche
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Status:</span>
                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? "all")}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue className="hidden" />
                    <span className="flex flex-1 text-left items-center truncate">
                      {filterStatus === "all" ? "Alle Status" : statusOptionen.find(opt => opt.id.toString() === filterStatus)?.name}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" label="Alle Status">Alle Status</SelectItem>
                    {statusOptionen.map(opt => (
                      <SelectItem key={opt.id} value={opt.id.toString()} label={opt.name}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-slate-200/60 dark:border-slate-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableRow className="border-b-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 font-medium">Gast</TableHead>
                      <TableHead className="font-medium">Zimmer</TableHead>
                      <TableHead className="font-medium">Zeitraum</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="text-left font-medium">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservierungen.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">In dieser Woche gibt es keine Reservierungen.</TableCell></TableRow>
                    ) : (
                      filteredReservierungen.map((res) => (
                        <TableRow key={res.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-slate-900 dark:text-slate-100">{res.vorname} {res.nachname}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-medium text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <Bed className="w-4 h-4 opacity-50" />
                              ZMR {res.zimmer_nummer}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(res.check_in_datum).toLocaleDateString("de-DE")} - {new Date(res.check_out_datum).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={`font-medium px-2 py-0.5 ${getStatusColor(res.status)}`}>
                              {res.status || 'Unbekannt'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left py-4">
                            <div className="flex justify-start gap-1">
                              <Dialog
                                open={selectedRes?.id === res.id}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setSelectedRes(null);
                                    setIsEditingRes(false);
                                  } else {
                                    setSelectedRes(res);
                                    setTempStatusId(res.status_id?.toString() || "");
                                  }
                                }}
                              >
                                <DialogTrigger render={<Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600" />}>
                                  <Info className="w-4 h-4 mr-1.5" /> Details
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{isEditingRes ? "Reservierung bearbeiten" : `Buchungs-Details #${res.id}`}</DialogTitle>
                                    <DialogDescription>{isEditingRes ? "Passen Sie die Zeiträume oder Zusatzleistungen an." : "Status ändern oder Details einsehen."}</DialogDescription>
                                  </DialogHeader>
                                  
                                  {isEditingRes ? (
                                    <ReservationForm 
                                      gäste={gäste} 
                                      zimmer={zimmer} 
                                      initialData={res} 
                                      onSave={() => {
                                        setIsEditingRes(false);
                                        setSelectedRes(null);
                                        queryClient.invalidateQueries({ queryKey: ["reservierungen"] });
                                      }} 
                                    />
                                  ) : (
                                    <div className="space-y-6">
                                      <div className="py-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                          <div className="space-y-0.5"><p className="text-slate-500">Gast</p><p className="font-medium">{res.vorname} {res.nachname}</p></div>
                                          <div className="space-y-0.5"><p className="text-slate-500">Zimmer</p><p className="font-medium">Nummer {res.zimmer_nummer}</p></div>
                                          <div className="space-y-0.5"><p className="text-slate-500">Email</p><p className="font-medium">{res.email}</p></div>
                                          <div className="space-y-0.5"><p className="text-slate-500">Telefon</p><p className="font-medium">{res.telefonnummer}</p></div>
                                          <div className="space-y-0.5 col-span-2"><p className="text-slate-500">Zeitraum</p><p className="font-medium">{new Date(res.check_in_datum).toLocaleDateString("de-DE")} bis {new Date(res.check_out_datum).toLocaleDateString("de-DE")}</p></div>
                                          <div className="space-y-0.5 col-span-2"><p className="text-slate-500">Adresse</p><p className="font-medium">{res.strasse} {res.hausnummer}, {res.postleitzahl} {res.stadt}, {res.land}</p></div>
                                          <div className="space-y-0.5"><p className="text-slate-500">Zusatzleistungen</p>
                                            <div className="flex gap-2.5 mt-1">
                                              {res.fruehstueck && <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 font-normal">🍳 Frühstück</Badge>}
                                              {res.parkplatz && <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-normal">🚗 Parkplatz</Badge>}
                                              {!res.fruehstueck && !res.parkplatz && <p className="text-xs italic text-slate-400">Keine</p>}
                                            </div>
                                          </div>
                                          {res.bemerkung && (
                                            <div className="space-y-0.5 col-span-2 pt-2"><p className="text-slate-500 text-xs">Anmerkungen</p><p className="text-slate-700 italic border-l-2 border-slate-200 pl-3 py-1 bg-slate-50/50 rounded-r-md">{res.bemerkung}</p></div>
                                          )}
                                          
                                          <div className="col-span-2 pt-4 border-t">
                                            <p className="text-slate-500 text-xs mb-2 flex items-center gap-1.5"><UserPlus className="w-3 h-3" /> Mitreisende Personen</p>
                                            <div className="space-y-1.5">
                                              <MitreisendeList reservierungId={res.id} />
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t">
                                          <Label>Status aktualisieren</Label>
                                          <div className="flex gap-2">
                                            <Select
                                              value={tempStatusId}
                                              onValueChange={val => setTempStatusId(val ?? "")}
                                            >
                                              <SelectTrigger className="flex-1">
                                                <SelectValue className="hidden" />
                                                <span className="flex flex-1 text-left items-center gap-1.5 line-clamp-1">
                                                  {tempStatusId
                                                    ? statusOptionen.find(opt => opt.id.toString() === tempStatusId)?.name || tempStatusId
                                                    : "Status wählen..."}
                                                </span>
                                              </SelectTrigger>
                                              <SelectContent>
                                                {statusOptionen.map(opt => (
                                                  <SelectItem key={opt.id} value={opt.id.toString()} label={opt.name}>{opt.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <Button
                                              size="sm"
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                              onClick={() => tempStatusId && updateStatus.mutate({ id: res.id, statusId: parseInt(tempStatusId) })}
                                              disabled={updateStatus.isPending || tempStatusId === res.status_id?.toString() || !tempStatusId}
                                            >
                                              {updateStatus.isPending ? "..." : "Speichern"}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                      <DialogFooter className="sm:justify-between border-t pt-4">
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 px-0"
                                            onClick={() => { if (confirm("Reservierung wirklich löschen?")) deleteRes.mutate(res.id); }}
                                          >
                                            <Trash2 className="w-4 h-4 mr-1.5" /> Löschen
                                          </Button>
                                          <Button variant="ghost" size="sm" onClick={() => setIsEditingRes(true)}>
                                            <Pencil className="w-4 h-4 mr-1.5" /> Bearbeiten
                                          </Button>
                                          <RechnungDialog reservierung={res} />
                                        </div>
                                        <Button variant="outline" onClick={() => setSelectedRes(null)}>Schließen</Button>
                                      </DialogFooter>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="m-0 focus-visible:outline-none">
            <Card className="border-slate-200/60 dark:border-slate-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableRow className="border-b-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 font-medium">Name</TableHead>
                      <TableHead className="font-medium">Kontakt</TableHead>
                      <TableHead className="font-medium">Adresse</TableHead>
                      <TableHead className="text-right pr-6 font-medium">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gäste.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500 italic">Noch keine Gäste im Stamm.</TableCell></TableRow>
                    ) : (
                      gäste.map((g) => (
                        <TableRow key={g.id} className="group">
                          <TableCell className="pl-6 py-4 font-medium">{g.vorname} {g.nachname}</TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {g.email}</div>
                              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {g.telefonnummer}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-500 w-1/4">
                            {g.strasse} {g.hausnummer}<br />
                            {g.postleitzahl} {g.stadt}<br />
                            {g.land}
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => setGuestHistory(g)} title="Historie & Rechnungen">
                                <FileText className="w-4 h-4 text-indigo-500" />
                              </Button>
                              <Dialog open={editingGuest?.id === g.id} onOpenChange={(open) => !open && setEditingGuest(null)}>
                                <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setEditingGuest(g)} />}>
                                  <Pencil className="w-4 h-4" />
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Gast bearbeiten</DialogTitle>
                                  </DialogHeader>
                                  {editingGuest?.id === g.id && (
                                    <GuestForm
                                      initialData={g}
                                      onSave={() => {
                                        setEditingGuest(null);
                                        queryClient.invalidateQueries({ queryKey: ["gäste"] });
                                        queryClient.invalidateQueries({ queryKey: ["reservierungen"] });
                                      }}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { if (confirm("Gast wirklich löschen?")) deleteGuest.mutate(g.id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {guestHistory && (
        <GuestHistoryViewer gast={guestHistory} onClose={() => setGuestHistory(null)} />
      )}
    </main>
  );
}

// ----------------------
// GUEST FORM
// ----------------------

function GuestForm({ onSave, initialData }: { onSave: (id?: number) => void, initialData?: any }) {
  const [formData, setFormData] = useState({
    vorname: initialData?.vorname || "",
    nachname: initialData?.nachname || "",
    email: initialData?.email || "",
    telefonnummer: initialData?.telefonnummer || "",
    strasse: initialData?.strasse || "",
    hausnummer: initialData?.hausnummer || "",
    postleitzahl: initialData?.postleitzahl || "",
    stadt: initialData?.stadt || "",
    land: initialData?.land || "Deutschland"
  });

  const isEditing = !!initialData?.id;

  const isValid = 
    formData.vorname.trim() !== "" &&
    formData.nachname.trim() !== "" &&
    formData.email.includes("@") &&
    /^[+\d\s]+$/.test(formData.telefonnummer) &&
    formData.strasse.trim() !== "" &&
    formData.hausnummer.trim() !== "" &&
    formData.postleitzahl.trim() !== "" &&
    formData.stadt.trim() !== "" &&
    formData.land.trim() !== "";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error("Bitte alle Felder korrekt ausfüllen.");
      if (isEditing) {
        await executeQuery(`UPDATE Gast SET vorname = '${formData.vorname}', nachname = '${formData.nachname}', email = '${formData.email}', telefonnummer = '${formData.telefonnummer}', strasse = '${formData.strasse}', hausnummer = '${formData.hausnummer}', postleitzahl = '${formData.postleitzahl}', stadt = '${formData.stadt}', land = '${formData.land}' WHERE id = ${initialData.id}`);
        return initialData.id;
      } else {
        await executeQuery(`INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse, hausnummer, postleitzahl, stadt, land) VALUES ('${formData.vorname}', '${formData.nachname}', '${formData.email}', '${formData.telefonnummer}', '${formData.strasse}', '${formData.hausnummer}', '${formData.postleitzahl}', '${formData.stadt}', '${formData.land}')`);
        const res = await executeQuery<{ id: number }[]>("SELECT MAX(id) as id FROM Gast");
        return res[0].id;
      }
    },
    onSuccess: (id) => onSave(id),
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Vorname*</Label><Input value={formData.vorname} onChange={e => setFormData({ ...formData, vorname: e.target.value })} /></div>
        <div className="space-y-2"><Label>Nachname*</Label><Input value={formData.nachname} onChange={e => setFormData({ ...formData, nachname: e.target.value })} /></div>
      </div>
      <div className="space-y-2">
        <Label>Email*</Label>
        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@beispiel.de" />
        {formData.email && !formData.email.includes("@") && <p className="text-xs text-red-500">Ungültige Email-Adresse (muss @ enthalten)</p>}
      </div>
      <div className="space-y-2">
        <Label>Telefon* (Ziffern & +)</Label>
        <Input value={formData.telefonnummer} onChange={e => setFormData({ ...formData, telefonnummer: e.target.value })} placeholder="+49 123 456789" />
        {formData.telefonnummer && !/^[+\d\s]+$/.test(formData.telefonnummer) && <p className="text-xs text-red-500">Nur Zahlen, Leerzeichen und + erlaubt</p>}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-2"><Label>Straße*</Label><Input value={formData.strasse} onChange={e => setFormData({ ...formData, strasse: e.target.value })} /></div>
        <div className="space-y-2"><Label>Hausnr.*</Label><Input value={formData.hausnummer} onChange={e => setFormData({ ...formData, hausnummer: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>PLZ*</Label><Input value={formData.postleitzahl} onChange={e => setFormData({ ...formData, postleitzahl: e.target.value })} /></div>
        <div className="col-span-2 space-y-2"><Label>Stadt*</Label><Input value={formData.stadt} onChange={e => setFormData({ ...formData, stadt: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Land*</Label><Input value={formData.land} onChange={e => setFormData({ ...formData, land: e.target.value })} /></div>
      <Button onClick={() => mutation.mutate()} className="w-full bg-slate-900" disabled={mutation.isPending || !isValid}>
        {mutation.isPending ? "Speichern..." : "Gast speichern"}
      </Button>
    </div>
  );
}

// ----------------------
// RESERVATION FORM
// ----------------------

function ReservationForm({ gäste, zimmer, onSave, initialData }: { gäste: Gast[], zimmer: Zimmer[], onSave: () => void, initialData?: Reservierung }) {
  const isEditing = !!initialData?.id;
  const [useExistingGuest, setUseExistingGuest] = useState(true);
  const [selectedGuestId, setSelectedGuestId] = useState<string>(initialData?.gast_id.toString() || "");
  const [guestFormData, setGuestFormData] = useState({ vorname: "", nachname: "", email: "", telefonnummer: "", strasse: "", hausnummer: "", postleitzahl: "", stadt: "", land: "Deutschland" });
  const [resData, setResData] = useState({ 
    zimmer_id: initialData?.zimmer_id.toString() || "", 
    check_in: initialData?.check_in_datum ? new Date(initialData.check_in_datum).toISOString().split("T")[0] : "", 
    check_out: initialData?.check_out_datum ? new Date(initialData.check_out_datum).toISOString().split("T")[0] : "", 
    status_id: initialData?.status_id.toString() || "1",
    fruehstueck: initialData?.fruehstueck || false, 
    parkplatz: initialData?.parkplatz || false, 
    bemerkung: initialData?.bemerkung || "",
    mitreisende: [] as Mitreisender[]
  });

  useEffect(() => {
    if (isEditing && initialData?.id) {
       executeQuery<Mitreisender[]>(`SELECT * FROM Mitreisender WHERE reservierung_id = ${initialData.id}`)
         .then(res => setResData(prev => ({ ...prev, mitreisende: res })));
    }
  }, [isEditing, initialData?.id]);

  const isGuestValid = useExistingGuest 
    ? selectedGuestId !== "" 
    : (
      guestFormData.vorname.trim() !== "" &&
      guestFormData.nachname.trim() !== "" &&
      guestFormData.email.includes("@") &&
      /^[+\d\s]+$/.test(guestFormData.telefonnummer) &&
      guestFormData.strasse.trim() !== "" &&
      guestFormData.hausnummer.trim() !== "" &&
      guestFormData.postleitzahl.trim() !== "" &&
      guestFormData.stadt.trim() !== "" &&
      guestFormData.land.trim() !== ""
    );

  const isResValid = resData.zimmer_id !== "" && resData.check_in !== "" && resData.check_out !== "";
  const isValid = isGuestValid && isResValid;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error("Bitte alle Felder korrekt ausfüllen.");
      let gastId = selectedGuestId;

      if (!useExistingGuest) {
        await executeQuery(`INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse, hausnummer, postleitzahl, stadt, land) VALUES ('${guestFormData.vorname}', '${guestFormData.nachname}', '${guestFormData.email}', '${guestFormData.telefonnummer}', '${guestFormData.strasse}', '${guestFormData.hausnummer}', '${guestFormData.postleitzahl}', '${guestFormData.stadt}', '${guestFormData.land}')`);
        const res = await executeQuery<{ id: number }[]>("SELECT MAX(id) as id FROM Gast");
        gastId = res[0].id.toString();
      }

      let targetResId: number;
      if (isEditing) {
        await executeQuery(
          `UPDATE Reservierung SET 
            gast_id = ${gastId}, 
            zimmer_id = ${resData.zimmer_id}, 
            start = '${resData.check_in}', 
            ende = '${resData.check_out}', 
            fruehstueck = ${resData.fruehstueck}, 
            parkplatz = ${resData.parkplatz}, 
            bemerkung = '${resData.bemerkung.replace(/'/g, "''")}' 
          WHERE id = ${initialData.id}`
        );
        targetResId = initialData.id;
      } else {
        await executeQuery(
          `INSERT INTO Reservierung (gast_id, zimmer_id, start, ende, status_id, fruehstueck, parkplatz, bemerkung) 
           VALUES (${gastId}, ${resData.zimmer_id}, '${resData.check_in}', '${resData.check_out}', 1, ${resData.fruehstueck}, ${resData.parkplatz}, '${resData.bemerkung.replace(/'/g, "''")}')`
        );
        const res = await executeQuery<{ id: number }[]>("SELECT MAX(id) as id FROM Reservierung");
        targetResId = res[0].id;
      }

      await executeQuery(`DELETE FROM Mitreisender WHERE reservierung_id = ${targetResId}`);
      for (const m of resData.mitreisende) {
         await executeQuery(`INSERT INTO Mitreisender (reservierung_id, vorname, nachname, geburtsdatum) VALUES (${targetResId}, '${m.vorname}', '${m.nachname}', '${m.geburtsdatum}')`);
      }
    },
    onSuccess: onSave
  });

  return (
    <div className="space-y-6 pt-3">
      {!isEditing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <Label className="text-sm font-semibold text-indigo-600">1. Gast wählen</Label>
            <div className="flex gap-2">
              <Button variant={useExistingGuest ? "default" : "outline"} size="sm" onClick={() => setUseExistingGuest(true)} className="h-7 text-xs">Bestand</Button>
              <Button variant={!useExistingGuest ? "default" : "outline"} size="sm" onClick={() => setUseExistingGuest(false)} className="h-7 text-xs">Neu anlegen</Button>
            </div>
          </div>

          {useExistingGuest ? (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Bestandskunden suchen</Label>
              <Select value={selectedGuestId} onValueChange={(val) => setSelectedGuestId(val ?? "")}>
                <SelectTrigger>
                  <SelectValue className="hidden" />
                  <span className="flex flex-1 text-left items-center gap-1.5 line-clamp-1">
                    {selectedGuestId
                      ? (() => { const g = gäste.find(g => g.id.toString() === selectedGuestId); return g ? `${g.nachname}, ${g.vorname} (${g.email})` : selectedGuestId; })()
                      : "Wähle einen Gast..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {gäste.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()} label={`${g.nachname}, ${g.vorname}`}>
                      {g.nachname}, {g.vorname} ({g.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Vorname*</Label><Input placeholder="Vorname" onChange={e => setGuestFormData({ ...guestFormData, vorname: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Nachname*</Label><Input placeholder="Nachname" onChange={e => setGuestFormData({ ...guestFormData, nachname: e.target.value })} /></div>
              
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Email*</Label>
                <Input placeholder="Email" onChange={e => setGuestFormData({ ...guestFormData, email: e.target.value })} />
                {guestFormData.email && !guestFormData.email.includes("@") && <p className="text-[10px] text-red-500">Muss @ enthalten</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Telefon* (Ziffern/+/Leerzeiche)</Label>
                <Input placeholder="Telefon" onChange={e => setGuestFormData({ ...guestFormData, telefonnummer: e.target.value })} />
                {guestFormData.telefonnummer && !/^[+\d\s]+$/.test(guestFormData.telefonnummer) && <p className="text-[10px] text-red-500">Nur Zahlen, Leerzeichen und + erlaubt</p>}
              </div>

              <div className="grid grid-cols-4 gap-2 col-span-2">
                <div className="col-span-3 space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Straße*</Label><Input placeholder="Straße" onChange={e => setGuestFormData({ ...guestFormData, strasse: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Hausnr.*</Label><Input placeholder="Hausnr." onChange={e => setGuestFormData({ ...guestFormData, hausnummer: e.target.value })} /></div>
              </div>

              <div className="grid grid-cols-4 gap-2 col-span-2">
                <div className="space-y-1 text-center"><Label className="text-[10px] uppercase font-bold text-slate-400">PLZ*</Label><Input placeholder="PLZ" onChange={e => setGuestFormData({ ...guestFormData, postleitzahl: e.target.value })} /></div>
                <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Stadt*</Label><Input placeholder="Stadt" onChange={e => setGuestFormData({ ...guestFormData, stadt: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Land*</Label><Input placeholder="Land" defaultValue="Deutschland" onChange={e => setGuestFormData({ ...guestFormData, land: e.target.value })} /></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={isEditing ? "" : "space-y-3 pt-3 border-t"}>
        <Label className="text-sm font-semibold text-indigo-600">{isEditing ? "Buchungs-Daten anpassen" : "2. Buchungs-Details"}</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Verfügbares Zimmer</Label>
            <Select value={resData.zimmer_id} onValueChange={val => setResData({ ...resData, zimmer_id: val ?? "" })}>
              <SelectTrigger>
                <SelectValue className="hidden" />
                <span className="flex flex-1 text-left items-center gap-1.5 line-clamp-1">
                  {resData.zimmer_id
                    ? (() => { const z = zimmer.find(z => z.id.toString() === resData.zimmer_id); return z ? `Zimmer ${z.nummer}` : resData.zimmer_id; })()
                    : "Zimmer wählen..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                {zimmer.map(z => (
                  <SelectItem key={z.id} value={z.id.toString()} label={`Zimmer ${z.nummer}`}>
                    Zimmer {z.nummer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Check-In</Label>
            <Input type="date" value={resData.check_in} onChange={e => setResData({ ...resData, check_in: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Check-Out</Label>
            <Input type="date" value={resData.check_out} onChange={e => setResData({ ...resData, check_out: e.target.value })} />
          </div>
          <div className="col-span-3 space-y-3 pt-1">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={resData.fruehstueck}
                  onChange={e => setResData({ ...resData, fruehstueck: e.target.checked })}
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Frühstück hinzugefügt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={resData.parkplatz}
                  onChange={e => setResData({ ...resData, parkplatz: e.target.checked })}
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Parkplatz buchen</span>
              </label>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Anmerkungen</Label>
              <textarea 
                className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400"
                placeholder="z.B. Allergien..."
                value={resData.bemerkung}
                onChange={e => setResData({ ...resData, bemerkung: e.target.value })}
              />
            </div>
          </div>

          <div className="col-span-3 space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-indigo-600">Mitreisende Personen</Label>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => setResData(prev => ({ 
                  ...prev, 
                  mitreisende: [...prev.mitreisende, { vorname: "", nachname: "", geburtsdatum: "" }] 
                }))}
              >
                <Plus className="w-3 h-3 mr-1.5" /> Hinzufügen
              </Button>
            </div>
            
            <div className="space-y-2">
              {resData.mitreisende.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Vorname</Label>
                    <Input 
                      className="h-8 text-xs" 
                      value={m.vorname} 
                      onChange={e => {
                        const next = [...resData.mitreisende];
                        next[idx].vorname = e.target.value;
                        setResData({ ...resData, mitreisende: next });
                      }} 
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Nachname</Label>
                    <Input 
                      className="h-8 text-xs" 
                      value={m.nachname} 
                      onChange={e => {
                        const next = [...resData.mitreisende];
                        next[idx].nachname = e.target.value;
                        setResData({ ...resData, mitreisende: next });
                      }} 
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Geburtstag</Label>
                    <Input 
                      type="date" 
                      className="h-8 text-xs" 
                      value={m.geburtsdatum ? new Date(m.geburtsdatum).toISOString().split("T")[0] : ""} 
                      onChange={e => {
                        const next = [...resData.mitreisende];
                        next[idx].geburtsdatum = e.target.value;
                        setResData({ ...resData, mitreisende: next });
                      }} 
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      type="button"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const next = resData.mitreisende.filter((_, i) => i !== idx);
                        setResData({ ...resData, mitreisende: next });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {resData.mitreisende.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-2">Keine Mitreisenden angegeben.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-6 border-t flex-col items-center">
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-medium"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !isValid}
        >
          {mutation.isPending ? "Speichern..." : isEditing ? "Änderungen speichern" : "Reservierung jetzt abschließen"}
        </Button>
        {!isValid && <p className="text-[10px] text-slate-400 mt-2">* Alle Felder sind Pflichtfelder</p>}
      </DialogFooter>
    </div>
  );
}

function MitreisendeList({ reservierungId }: { reservierungId: number }) {
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["mitreisende", reservierungId],
    queryFn: () => executeQuery<Mitreisender[]>(`SELECT * FROM Mitreisender WHERE reservierung_id = ${reservierungId}`),
  });

  if (isLoading) return <p className="text-[10px] text-slate-400">Lade Mitreisende...</p>;
  if (list.length === 0) return <p className="text-[10px] text-slate-400 italic font-normal">Keine Mitreisenden.</p>;

  return (
    <div className="grid grid-cols-1 gap-1">
      {list.map((m, i) => (
        <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100/50">
          <span className="text-xs font-medium text-slate-700">{m.vorname} {m.nachname}</span>
          <span className="text-[10px] text-slate-500">{m.geburtsdatum ? new Date(m.geburtsdatum).toLocaleDateString("de-DE") : "-"}</span>
        </div>
      ))}
    </div>
  );
}

// ----------------------
// HISTORIE UND RECHNUNG
// ----------------------

type Zusatzleistung = {
  id: number;
  reservierung_id: number;
  name: string;
  preis: number;
  anzahl: number;
};

function GuestHistoryViewer({ gast, onClose }: { gast: Gast, onClose: () => void }) {
  const { data: resList = [], isLoading } = useQuery({
    queryKey: ["gast_hist", gast.id],
    queryFn: () => executeQuery<Reservierung[]>(`
        SELECT r.id, r.start as check_in_datum, r.ende as check_out_datum, r.status_id, r.gast_id, r.zimmer_id,
                r.fruehstueck, r.parkplatz, r.bemerkung,
                g.vorname, g.nachname, g.email, g.telefonnummer, g.strasse, g.hausnummer, g.postleitzahl, g.stadt, g.land,
                z.nummer as zimmer_nummer, k.preis as zimmer_preis, s.name as status
         FROM Reservierung r 
         JOIN Gast g ON r.gast_id = g.id 
         JOIN zimmer z ON r.zimmer_id = z.id 
         JOIN Kategorie k ON z.kategorie_id = k.id
         LEFT JOIN Status s ON r.status_id = s.id
         WHERE r.gast_id = ${gast.id}
         ORDER BY r.start DESC
    `)
  });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historie & Rechnungen: {gast.vorname} {gast.nachname}</DialogTitle>
          <DialogDescription>Alle Aufenthalte dieses Gastes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {isLoading ? (
            <p className="text-center text-slate-500 py-4">Lade Historie...</p>
          ) : resList.length === 0 ? (
            <p className="text-center text-slate-500 py-4">Bisher keine Buchungen für diesen Gast.</p>
          ) : (
            resList.map(res => (
              <div key={res.id} className="border rounded-md p-4 flex justify-between items-center bg-slate-50/50">
                <div>
                  <p className="font-semibold text-slate-800">
                    {new Date(res.check_in_datum).toLocaleDateString("de-DE")} - {new Date(res.check_out_datum).toLocaleDateString("de-DE")}
                  </p>
                  <p className="text-sm text-slate-500">Zimmer {res.zimmer_nummer} • Status: {res.status}</p>
                </div>
                <RechnungDialog reservierung={res} />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RechnungDialog({ reservierung }: { reservierung: Reservierung }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const dStart = new Date(reservierung.check_in_datum);
  const dEnd = new Date(reservierung.check_out_datum);
  dStart.setHours(0,0,0,0);
  dEnd.setHours(0,0,0,0);
  const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const zimmerSum = (reservierung.zimmer_preis || 0) * nights;
  const fruehstueckSum = reservierung.fruehstueck ? (15 * nights) : 0;
  const parkSum = reservierung.parkplatz ? (10 * nights) : 0;

  const { data: extList = [] } = useQuery({
    queryKey: ["zusatzleistung", reservierung.id],
    queryFn: () => executeQuery<Zusatzleistung[]>(`SELECT * FROM Zusatzleistung WHERE reservierung_id = ${reservierung.id}`),
    enabled: isOpen
  });

  const extSum = extList.reduce((acc, curr) => acc + (curr.preis * curr.anzahl), 0);
  const total = zimmerSum + fruehstueckSum + parkSum + extSum;

  const [newName, setNewName] = useState("");
  const [newPreis, setNewPreis] = useState("");
  
  const addLeistung = useMutation({
    mutationFn: () => {
      if (!newName || !newPreis) throw new Error("Name und Preis erforderlich");
      const preisNum = parseFloat(newPreis.replace(',', '.'));
      if (isNaN(preisNum)) throw new Error("Preis ungültig");
      return executeQuery(`INSERT INTO Zusatzleistung (reservierung_id, name, preis) VALUES (${reservierung.id}, '${newName}', ${preisNum})`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zusatzleistung", reservierung.id] });
      setNewName("");
      setNewPreis("");
    },
    onError: (err: any) => alert(err.message)
  });

  const deleteLeistung = useMutation({
    mutationFn: (id: number) => executeQuery(`DELETE FROM Zusatzleistung WHERE id = ${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zusatzleistung", reservierung.id] });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-indigo-200 text-indigo-700 gap-1.5 shadow-sm" />}>
        <div className="flex items-center gap-1.5"><Receipt className="w-4 h-4"/> Rechnung zeigen</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700">
            <Receipt className="w-5 h-5"/> Gastrechnung
          </DialogTitle>
          <DialogDescription>
            Rechnung für Buchung #{reservierung.id} • {reservierung.vorname} {reservierung.nachname}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="bg-slate-50 border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3 border-b pb-2">Gebuchte Leistungen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Zimmer #{reservierung.zimmer_nummer} ({nights} Nächte á {reservierung.zimmer_preis}€)</span>
                <span className="font-medium text-slate-800">{zimmerSum.toFixed(2)} €</span>
              </div>
              {reservierung.fruehstueck && (
                <div className="flex justify-between items-center text-orange-700/80">
                  <span>Frühstückspauschale ({nights} Nächte á 15€)</span>
                  <span className="font-medium">{fruehstueckSum.toFixed(2)} €</span>
                </div>
              )}
              {reservierung.parkplatz && (
                <div className="flex justify-between items-center text-blue-700/80">
                  <span>Parkplatz ({nights} Nächte á 10€)</span>
                  <span className="font-medium">{parkSum.toFixed(2)} €</span>
                </div>
              )}
              {extList.map(ext => (
                <div key={ext.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <span>{ext.name} (1x)</span>
                    <button onClick={() => deleteLeistung.mutate(ext.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                  </div>
                  <span className="font-medium">{(ext.preis * ext.anzahl).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-slate-200 font-bold text-lg">
              <span>Gesamtbetrag</span>
              <span className="text-indigo-700">{total.toFixed(2)} €</span>
            </div>
          </div>

          <div className="space-y-2">
             <Label className="text-xs font-semibold text-slate-500 uppercase">Zusatzleistung hinzufügen</Label>
             <div className="flex gap-2">
               <Input placeholder="Z.b. Minibar, Massage..." className="flex-1" value={newName} onChange={e => setNewName(e.target.value)} />
               <Input placeholder="15.00" className="w-24 text-right" value={newPreis} onChange={e => setNewPreis(e.target.value)} />
               <div className="flex items-center justify-center bg-slate-100 px-3 border border-l-0 -ml-2 rounded-r-md text-slate-500 font-medium">€</div>
               <Button onClick={() => addLeistung.mutate()} disabled={addLeistung.isPending} className="bg-slate-800 text-white ml-2"><Plus className="w-4 h-4 mr-1"/> Hinzufügen</Button>
             </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
