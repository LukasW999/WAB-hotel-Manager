"use client";

import { useState } from "react";
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
import { Search, Plus, Trash2, Calendar, User, Bed, Phone, Mail, CheckCircle, Info, UserPlus, Pencil } from "lucide-react";

type Gast = {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer: string;
  adresse: string;
};

type Reservierung = {
  id: number;
  gast_id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer: string;
  strasse: string;
  zimmer_id: number;
  zimmer_nummer: number;
  check_in_datum: string;
  check_out_datum: string;
  status_id: number;
  status: string;
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
  const [tempStatusId, setTempStatusId] = useState<string>("");
  const [editingGuest, setEditingGuest] = useState<Gast | null>(null);

  // Queries
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
                g.vorname, g.nachname, g.email, g.telefonnummer, g.strasse,
                z.nummer as zimmer_nummer, s.name as status
         FROM Reservierung r 
         JOIN Gast g ON r.gast_id = g.id 
         JOIN zimmer z ON r.zimmer_id = z.id 
         LEFT JOIN Status s ON r.status_id = s.id
         ORDER BY r.start DESC`
      ),
  });

  const { data: zimmer = [] } = useQuery({
    queryKey: ["zimmer_lite"],
    queryFn: () => executeQuery<Zimmer[]>("SELECT id, nummer FROM zimmer WHERE aktiv = true ORDER BY nummer ASC"),
  });

  // Mutations
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
      // Prüfen ob Gast Reservierungen hat. 
      const res = await executeQuery<any[]>(`SELECT id FROM Reservierung WHERE gast_id = ${id}`);
      if (res.length > 0) throw new Error("Gast hat noch aktive Reservierungen!");
      await executeQuery(`DELETE FROM Gast WHERE id = ${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gäste"] }),
    onError: (err: any) => alert(err.message),
  });

  return (
    <>
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
                    <DialogContent className="sm:max-w-[600px]">
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
                      {reservierungen.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">Keine Reservierungen vorhanden.</TableCell></TableRow>
                      ) : (
                        reservierungen.map((res) => (
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
                                    if (!open) setSelectedRes(null);
                                    else {
                                      setSelectedRes(res);
                                      setTempStatusId(res.status_id?.toString() || "");
                                    }
                                  }}
                                >
                                  <DialogTrigger render={<Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600" />}>
                                    <Info className="w-4 h-4 mr-1.5" /> Details
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Buchungs-Details #{res.id}</DialogTitle>
                                      <DialogDescription>Status ändern oder Details einsehen.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                        <div className="space-y-0.5"><p className="text-slate-500">Gast</p><p className="font-medium">{res.vorname} {res.nachname}</p></div>
                                        <div className="space-y-0.5"><p className="text-slate-500">Zimmer</p><p className="font-medium">Nummer {res.zimmer_nummer}</p></div>
                                        <div className="space-y-0.5"><p className="text-slate-500">Email</p><p className="font-medium">{res.email}</p></div>
                                        <div className="space-y-0.5"><p className="text-slate-500">Telefon</p><p className="font-medium">{res.telefonnummer}</p></div>
                                        <div className="space-y-0.5 col-span-2"><p className="text-slate-500">Zeitraum</p><p className="font-medium">{new Date(res.check_in_datum).toLocaleDateString("de-DE")} bis {new Date(res.check_out_datum).toLocaleDateString("de-DE")}</p></div>
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
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-0"
                                        onClick={() => confirm("Reservierung wirklich löschen?") && deleteRes.mutate(res.id)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" /> Reservierung löschen
                                      </Button>
                                      <Button variant="outline" onClick={() => setSelectedRes(null)}>Schließen</Button>
                                    </DialogFooter>
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
                             <TableCell className="py-4 text-sm text-slate-500 w-1/4">{g.adresse}</TableCell>
                             <TableCell className="text-right pr-6 py-4">
                               <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                 <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { if(confirm("Gast wirklich löschen?")) deleteGuest.mutate(g.id); }}>
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
      </main>
    </>
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
    adresse: initialData?.strasse || initialData?.adresse || ""
  });

  const isEditing = !!initialData?.id;

  const mutation = useMutation({
    mutationFn: async () => {
       if (isEditing) {
         await executeQuery(`UPDATE Gast SET vorname = '${formData.vorname}', nachname = '${formData.nachname}', email = '${formData.email}', telefonnummer = '${formData.telefonnummer}', strasse = '${formData.adresse}' WHERE id = ${initialData.id}`);
         return initialData.id;
       } else {
         await executeQuery(`INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse) VALUES ('${formData.vorname}', '${formData.nachname}', '${formData.email}', '${formData.telefonnummer}', '${formData.adresse}')`);
         const res = await executeQuery<{ id: number }[]>("SELECT MAX(id) as id FROM Gast");
         return res[0].id;
       }
    },
    onSuccess: (id) => onSave(id),
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Vorname</Label><Input value={formData.vorname} onChange={e => setFormData({...formData, vorname: e.target.value})} /></div>
        <div className="space-y-2"><Label>Nachname</Label><Input value={formData.nachname} onChange={e => setFormData({...formData, nachname: e.target.value})} /></div>
      </div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
      <div className="space-y-2"><Label>Telefon</Label><Input value={formData.telefonnummer} onChange={e => setFormData({...formData, telefonnummer: e.target.value})} /></div>
      <div className="space-y-2"><Label>Adresse</Label><Input value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} /></div>
      <Button onClick={() => mutation.mutate()} className="w-full bg-slate-900" disabled={mutation.isPending}>Gast speichern</Button>
    </div>
  );
}

// ----------------------
// RESERVATION FORM
// ----------------------

function ReservationForm({ gäste, zimmer, onSave }: { gäste: Gast[], zimmer: Zimmer[], onSave: () => void }) {
  const [useExistingGuest, setUseExistingGuest] = useState(true);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [guestFormData, setGuestFormData] = useState({ vorname: "", nachname: "", email: "", telefonnummer: "", adresse: "" });
  const [resData, setResData] = useState({ zimmer_id: "", check_in: "", check_out: "", status: "BESTAETIGT" });

  const mutation = useMutation({
    mutationFn: async () => {
      let gastId = selectedGuestId;
      
      if (!useExistingGuest) {
        // Create Guest First - Simplified address mapping
        await executeQuery(`INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse) VALUES ('${guestFormData.vorname}', '${guestFormData.nachname}', '${guestFormData.email}', '${guestFormData.telefonnummer}', '${guestFormData.adresse}')`);
        const res = await executeQuery<{id: number}[]>("SELECT MAX(id) as id FROM Gast");
        gastId = res[0].id.toString();
      }

      await executeQuery(
        `INSERT INTO Reservierung (gast_id, zimmer_id, start, ende, status_id) 
         VALUES (${gastId}, ${resData.zimmer_id}, '${resData.check_in}', '${resData.check_out}', 2)`
      );
    },
    onSuccess: onSave
  });

  return (
    <div className="space-y-8 pt-4">
      {/* Step 1: Guest */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <Label className="text-base font-semibold">1. Gast wählen</Label>
          <div className="flex gap-2">
            <Button variant={useExistingGuest ? "default" : "outline"} size="sm" onClick={() => setUseExistingGuest(true)}>Bestand</Button>
            <Button variant={!useExistingGuest ? "default" : "outline"} size="sm" onClick={() => setUseExistingGuest(false)}>Neu anlegen</Button>
          </div>
        </div>

        {useExistingGuest ? (
          <div className="space-y-2">
             <Label>Bestandskunden suchen</Label>
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
             <Input placeholder="Vorname" onChange={e => setGuestFormData({...guestFormData, vorname: e.target.value})} />
             <Input placeholder="Nachname" onChange={e => setGuestFormData({...guestFormData, nachname: e.target.value})} />
             <Input placeholder="Email" className="col-span-2" onChange={e => setGuestFormData({...guestFormData, email: e.target.value})} />
             <Input placeholder="Telefon" className="col-span-2" onChange={e => setGuestFormData({...guestFormData, telefonnummer: e.target.value})} />
             <Input placeholder="Adresse" className="col-span-2" onChange={e => setGuestFormData({...guestFormData, adresse: e.target.value})} />
          </div>
        )}
      </div>

      {/* Step 2: Details */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">2. Buchungs-Details</Label>
        <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2 space-y-2">
             <Label>Verfügbares Zimmer</Label>
             <Select value={resData.zimmer_id} onValueChange={val => setResData({...resData, zimmer_id: val ?? ""})}>
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
           <div className="space-y-2">
             <Label>Check-In</Label>
             <Input type="date" onChange={e => setResData({...resData, check_in: e.target.value})} />
           </div>
           <div className="space-y-2">
             <Label>Check-Out</Label>
             <Input type="date" onChange={e => setResData({...resData, check_out: e.target.value})} />
           </div>
        </div>
      </div>

      <DialogFooter className="pt-6 border-t">
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-medium" 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (!selectedGuestId && useExistingGuest) || (!resData.zimmer_id)}
        >
          {mutation.isPending ? "Wird gebucht..." : "Reservierung jetzt abschließen"}
        </Button>
      </DialogFooter>
    </div>
  );
}
