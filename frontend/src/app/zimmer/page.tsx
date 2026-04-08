"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Bed, Info, CheckCircle2, XCircle } from "lucide-react";

type Zimmer = {
  zimmer_id: number;
  nummer: number;
  aktiv: boolean;
  kategorie_id: number;
  kategorie_name: string;
};

type Kategorie = {
  kategorie_id: number;
  name: string;
  preis: number;
  betten_anzahl: number;
};

export default function ZimmerPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingZimmer, setEditingZimmer] = useState<Zimmer | null>(null);

  const { data: zimmer = [], isLoading: isLoadingZimmer } = useQuery({
    queryKey: ["zimmer"],
    queryFn: () =>
      executeQuery<Zimmer[]>(
        `SELECT z.zimmer_id, z.nummer, z.aktiv, z.kategorie_id, k.name as kategorie_name 
         FROM zimmer z 
         JOIN Kategorie k ON z.kategorie_id = k.kategorie_id 
         ORDER BY z.nummer ASC`
      ),
  });

  const { data: kategorien = [] } = useQuery({
    queryKey: ["kategorien"],
    queryFn: () => executeQuery<Kategorie[]>("SELECT kategorie_id, name, preis, betten_anzahl FROM Kategorie ORDER BY name ASC"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Prüfe erst ob Reservierungen bestehen (optional, hier direktes Löschen)
      await executeQuery(`DELETE FROM zimmer WHERE zimmer_id = ${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zimmer"] });
    },
  });

  const filteredZimmer = zimmer.filter((z) =>
    z.nummer.toString().includes(searchTerm) || z.kategorie_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Zimmerverwaltung</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Zimmernummer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-slate-100/50 dark:bg-slate-800/50 border-none focus-visible:ring-1"
              />
            </div>
          </div>
        </header>

        <div className="p-8 overflow-auto flex-1">
          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="space-y-1">
                <CardTitle className="text-xl">Alle Zimmer</CardTitle>
                <CardDescription>Verwalte die Zimmer deines Hotels, deren Status und Kategorien.</CardDescription>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger 
                  render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200" />}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Zimmer hinzufügen
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Neues Zimmer anlegen</DialogTitle>
                  </DialogHeader>
                  <ZimmerForm
                    kategorien={kategorien}
                    onSave={() => {
                      setIsAddOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["zimmer"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-b-slate-100 dark:border-slate-800">
                    <TableHead className="pl-6 font-medium text-slate-500">Nummer</TableHead>
                    <TableHead className="font-medium text-slate-500">Kategorie</TableHead>
                    <TableHead className="font-medium text-slate-500">Status</TableHead>
                    <TableHead className="text-right pr-6 font-medium text-slate-500">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingZimmer ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">Lade Zimmer...</TableCell>
                    </TableRow>
                  ) : filteredZimmer.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">Keine Zimmer gefunden.</TableCell>
                    </TableRow>
                  ) : (
                    filteredZimmer.map((z) => (
                      <TableRow key={z.zimmer_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <TableCell className="pl-6 py-4 font-semibold text-lg text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <Bed className="w-5 h-5 text-slate-400" />
                            {z.nummer}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{z.kategorie_name}</span>
                            {/* Optional: Add Preis/Betten Info through kategorien data if needed */}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {z.aktiv ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none dark:bg-slate-800 dark:text-slate-400">
                              <XCircle className="w-3 h-3 mr-1" /> Inaktiv
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dialog open={editingZimmer?.zimmer_id === z.zimmer_id} onOpenChange={(open) => !open && setEditingZimmer(null)}>
                              <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setEditingZimmer(z)} />}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Bearbeiten
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Zimmer bearbeiten</DialogTitle>
                                </DialogHeader>
                                {editingZimmer?.zimmer_id === z.zimmer_id && (
                                  <ZimmerForm
                                    zimmer={z}
                                    kategorien={kategorien}
                                    onSave={() => {
                                      setEditingZimmer(null);
                                      queryClient.invalidateQueries({ queryKey: ["zimmer"] });
                                    }}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => {
                                if (confirm(`Zimmer ${z.nummer} wirklich löschen?`)) {
                                  deleteMutation.mutate(z.zimmer_id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
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
        </div>
      </main>
    </>
  );
}

function ZimmerForm({
  zimmer,
  kategorien,
  onSave,
}: {
  zimmer?: Zimmer;
  kategorien: Kategorie[];
  onSave: () => void;
}) {
  const isEditing = !!zimmer;
  const [formData, setFormData] = useState({
    nummer: zimmer?.nummer.toString() || "",
    kategorie_id: zimmer?.kategorie_id.toString() || (kategorien[0]?.kategorie_id.toString() || ""),
    aktiv: zimmer?.aktiv ?? true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        await executeQuery(
          `UPDATE zimmer SET 
            nummer = ${formData.nummer}, 
            kategorie_id = ${formData.kategorie_id}, 
            aktiv = ${formData.aktiv} 
           WHERE zimmer_id = ${zimmer.zimmer_id}`
        );
      } else {
        await executeQuery(
          `INSERT INTO zimmer (nummer, kategorie_id, aktiv) 
           VALUES (${formData.nummer}, ${formData.kategorie_id}, ${formData.aktiv})`
        );
      }
    },
    onSuccess: onSave,
  });

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nummer">Zimmernummer</Label>
          <Input
            id="nummer"
            type="number"
            value={formData.nummer}
            onChange={(e) => setFormData({ ...formData, nummer: e.target.value })}
            placeholder="z.B. 101"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Kategorie</Label>
          <Select 
            value={formData.kategorie_id} 
            onValueChange={(val) => setFormData({ ...formData, kategorie_id: val ?? "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue className="hidden" />
              <span className="flex flex-1 text-left items-center gap-1.5 truncate">
                {formData.kategorie_id
                  ? (() => { const k = kategorien.find(k => k.kategorie_id.toString() === formData.kategorie_id); return k ? `${k.name} (${k.preis}€, ${k.betten_anzahl} Betten)` : formData.kategorie_id; })()
                  : "Kategorie wählen"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {kategorien.map((kat) => (
                <SelectItem key={kat.kategorie_id} value={kat.kategorie_id.toString()} label={kat.name}>
                  {kat.name} ({kat.preis}€, {kat.betten_anzahl} Betten)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="aktiv"
            checked={formData.aktiv}
            onChange={(e) => setFormData({ ...formData, aktiv: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <Label htmlFor="aktiv" className="cursor-pointer">Zimmer ist aktiv (buchbar)</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
          className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 w-full"
        >
          {mutation.isPending ? "Speichern..." : "Zimmer speichern"}
        </Button>
      </div>
    </div>
  );
}
