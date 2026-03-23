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
import { Search, UserPlus, Pencil, Building2, Briefcase, Mail, Phone, Calendar, Trash2 } from "lucide-react";

type Mitarbeiter = {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer: string;
  geburtsdatum: string;
  statuses_json: string; // JSON Array of IDs
};

type Status = {
  id: number;
  name: string;
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Mitarbeiter | null>(null);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () =>
      executeQuery<Mitarbeiter[]>(
        `SELECT m.id, m.vorname, m.nachname, m.email, m.telefonnummer, m.geburtsdatum, 
         COALESCE(json_agg(w.status_id) FILTER (WHERE w.status_id IS NOT NULL), '[]')::text as statuses_json
         FROM Mitarbeiter m 
         LEFT JOIN Wird_Betreut_Von w ON m.id = w.mitarbeiter_id 
         GROUP BY m.id 
         ORDER BY m.id ASC`
      ),
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => executeQuery<Status[]>("SELECT * FROM Status ORDER BY id ASC"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Lösche zuerst verknüpfte Zuständigkeiten
      await executeQuery(`DELETE FROM Wird_Betreut_Von WHERE mitarbeiter_id = ${id}`);
      // Lösche dann den Mitarbeiter
      await executeQuery(`DELETE FROM Mitarbeiter WHERE id = ${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  // Filter
  const filteredEmployees = employees.filter((e) =>
    `${e.vorname} ${e.nachname} ${e.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Mitarbeiter</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Suchen..."
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
                <CardTitle className="text-xl">Belegschaft</CardTitle>
                <CardDescription>Erstelle und verwalte Hotel-Mitarbeiter und ihre Zuständigkeiten.</CardDescription>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger 
                  render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200" />}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Mitarbeiter anlegen
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Neuer Mitarbeiter</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm
                    statuses={statuses}
                    onSave={() => {
                      setIsAddOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["employees"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-b-slate-100 dark:border-slate-800">
                    <TableHead className="pl-6 font-medium text-slate-500">Name</TableHead>
                    <TableHead className="font-medium text-slate-500">Kontakt</TableHead>
                    <TableHead className="font-medium text-slate-500">Zugewiesene Status (Zuständigkeit)</TableHead>
                    <TableHead className="text-right pr-6 font-medium text-slate-500">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingEmployees ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">Lade Daten...</TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">Keine Mitarbeiter gefunden.</TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const assignedIds: number[] = JSON.parse(emp.statuses_json || "[]");
                      return (
                        <TableRow key={emp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-sm">
                                {emp.vorname[0]}{emp.nachname[0]}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {emp.vorname} {emp.nachname}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(emp.geburtsdatum).toLocaleDateString("de-DE")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                {emp.email}
                              </div>
                              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                {emp.telefonnummer}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {assignedIds.length === 0 && <span className="text-sm text-slate-400 italic">Keine zugewiesen</span>}
                              {assignedIds.map((sid) => {
                                const st = statuses.find((s) => s.id === sid);
                                return (
                                  <Badge key={sid} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none font-normal">
                                    {st?.name || `ID ${sid}`}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Dialog open={editingEmployee?.id === emp.id} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                                <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setEditingEmployee(emp)} />}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Bearbeiten
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
                                  </DialogHeader>
                                  {editingEmployee?.id === emp.id && (
                                    <EmployeeForm
                                      employee={emp}
                                      statuses={statuses}
                                      onSave={() => {
                                        setEditingEmployee(null);
                                        queryClient.invalidateQueries({ queryKey: ["employees"] });
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
                                  if (confirm(`Möchtest du ${emp.vorname} ${emp.nachname} wirklich löschen?`)) {
                                    deleteMutation.mutate(emp.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

// ----------------------
// FORMULAR COMPONENT
// ----------------------

function EmployeeForm({
  employee,
  statuses,
  onSave,
}: {
  employee?: Mitarbeiter;
  statuses: Status[];
  onSave: () => void;
}) {
  const isEditing = !!employee;
  const initialStatuses = employee ? JSON.parse(employee.statuses_json || "[]") : [];

  const [formData, setFormData] = useState({
    vorname: employee?.vorname || "",
    nachname: employee?.nachname || "",
    email: employee?.email || "",
    telefonnummer: employee?.telefonnummer || "",
    geburtsdatum: employee?.geburtsdatum ? new Date(employee.geburtsdatum).toISOString().split("T")[0] : "1990-01-01",
  });
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>(initialStatuses);

  const mutation = useMutation({
    mutationFn: async () => {
      let empId = employee?.id;

      if (!isEditing) {
        // Create - Note: jdbc update count trick doesn't give us ID directly unless we max query
        await executeQuery(
          `INSERT INTO Mitarbeiter (vorname, nachname, email, telefonnummer, geburtsdatum) 
           VALUES ('${formData.vorname}', '${formData.nachname}', '${formData.email}', '${formData.telefonnummer}', '${formData.geburtsdatum}')`
        );
        // Get the new ID
        const res = await executeQuery<{ id: number }[]>("SELECT MAX(id) as id FROM Mitarbeiter");
        empId = res[0].id;
      } else {
        // Update
        await executeQuery(
          `UPDATE Mitarbeiter SET 
            vorname = '${formData.vorname}', 
            nachname = '${formData.nachname}', 
            email = '${formData.email}', 
            telefonnummer = '${formData.telefonnummer}', 
            geburtsdatum = '${formData.geburtsdatum}' 
           WHERE id = ${empId}`
        );
      }

      // Sync Statuses
      if (empId) {
        // Clear all current statuses for this employee
        await executeQuery(`DELETE FROM Wird_Betreut_Von WHERE mitarbeiter_id = ${empId}`);

        // Insert new ones
        for (const statusId of selectedStatuses) {
          await executeQuery(`INSERT INTO Wird_Betreut_Von (mitarbeiter_id, status_id) VALUES (${empId}, ${statusId})`);
        }
      }
    },
    onSuccess: onSave,
  });

  const toggleStatus = (id: number) => {
    setSelectedStatuses((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vorname</Label>
          <Input 
            value={formData.vorname} 
            onChange={(e) => setFormData({ ...formData, vorname: e.target.value })} 
            placeholder="Max"
          />
        </div>
        <div className="space-y-2">
          <Label>Nachname</Label>
          <Input 
            value={formData.nachname} 
            onChange={(e) => setFormData({ ...formData, nachname: e.target.value })} 
            placeholder="Mustermann"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            placeholder="m.mustermann@hotel.de"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input 
            value={formData.telefonnummer} 
            onChange={(e) => setFormData({ ...formData, telefonnummer: e.target.value })} 
            placeholder="+49 123 45678"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Geburtsdatum</Label>
          <Input 
            type="date" 
            value={formData.geburtsdatum} 
            onChange={(e) => setFormData({ ...formData, geburtsdatum: e.target.value })} 
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <Label className="text-base">Zuständigkeiten (Status-Berechtigungen)</Label>
        <p className="text-xs text-slate-500 mb-2">Wähle die Status aus, die dieser Mitarbeiter betreuen darf.</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const isSelected = selectedStatuses.includes(status.id);
            return (
              <Badge
                key={status.id}
                onClick={() => toggleStatus(status.id)}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 text-sm transition-all shadow-sm ${
                  isSelected ? "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {status.name}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
          className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          {mutation.isPending ? "Speichern..." : "Speichern"}
        </Button>
      </div>
    </div>
  );
}
