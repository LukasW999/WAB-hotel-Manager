import os
import re

filepath = "frontend/src/app/reservierungen/page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Type Definitions
text = text.replace("type Gast = {\n  id: number;", "type Gast = {\n  gast_id: number;")
text = text.replace("type Reservierung = {\n  id: number;", "type Reservierung = {\n  reservierung_id: number;")
text = text.replace("type Mitreisender = {\n  id?: number;", "type Mitreisender = {\n  mitreisender_id?: number;")
text = text.replace("type StatusOption = {\n  id: number;", "type StatusOption = {\n  status_id: number;")
text = text.replace("type Zimmer = {\n  id: number;", "type Zimmer = {\n  zimmer_id: number;")
text = text.replace("type Zusatzleistung = {\n  id: number;", "type Zusatzleistung = {\n  zusatzleistung_id: number;")

# SQL Queries
text = text.replace("SELECT id, name FROM Status", "SELECT status_id, name FROM Status")
text = text.replace("SELECT r.id, r.start", "SELECT r.reservierung_id, r.start")
text = text.replace("JOIN Gast g ON r.gast_id = g.id", "JOIN Gast g ON r.gast_id = g.gast_id")
text = text.replace("JOIN zimmer z ON r.zimmer_id = z.id", "JOIN zimmer z ON r.zimmer_id = z.zimmer_id")
text = text.replace("JOIN Kategorie k ON z.kategorie_id = k.id", "JOIN Kategorie k ON z.kategorie_id = k.kategorie_id")
text = text.replace("LEFT JOIN Status s ON r.status_id = s.id", "LEFT JOIN Status s ON r.status_id = s.status_id")

text = text.replace("SELECT id, nummer FROM zimmer", "SELECT zimmer_id, nummer FROM zimmer")
text = text.replace("UPDATE Reservierung SET status_id = ${statusId} WHERE id = ${id}", "UPDATE Reservierung SET status_id = ${statusId} WHERE reservierung_id = ${id}")
text = text.replace("DELETE FROM Reservierung WHERE id = ${id}", "DELETE FROM Reservierung WHERE reservierung_id = ${id}")

text = text.replace("SELECT id FROM Reservierung WHERE gast_id = ${id}", "SELECT reservierung_id FROM Reservierung WHERE gast_id = ${id}")
text = text.replace("DELETE FROM Gast WHERE id = ${id}", "DELETE FROM Gast WHERE gast_id = ${id}")

text = text.replace("RETURNING id\n          )", "RETURNING gast_id\n          )")
text = text.replace("SELECT id FROM inserted_gast", "SELECT gast_id FROM inserted_gast")

text = text.replace("RETURNING id\n          ),", "RETURNING reservierung_id\n          ),")
text = text.replace("SELECT id FROM updated_res", "SELECT reservierung_id FROM updated_res")
text = text.replace("RETURNING id\n        )", "RETURNING reservierung_id\n        )")
text = text.replace("SELECT id FROM new_gast", "SELECT gast_id FROM new_gast")
text = text.replace("SELECT id FROM new_res", "SELECT reservierung_id FROM new_res")


# Update queries
text = text.replace("WHERE id = ${initialData.id}`)", "WHERE reservierung_id = ${initialData.reservierung_id}`)")

# regex for property accesses
text = re.sub(r'\bgast\.id\b', 'gast.gast_id', text)
text = re.sub(r'\bres\.id\b', 'res.reservierung_id', text)
text = re.sub(r'\bg\.id\b', 'g.gast_id', text)
text = re.sub(r'\bopt\.id\b', 'opt.status_id', text)
text = re.sub(r'\bz\.id\b', 'z.zimmer_id', text)
text = re.sub(r'\bext\.id\b', 'ext.zusatzleistung_id', text)
text = re.sub(r'\breservierung\.id\b', 'reservierung.reservierung_id', text)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)
print("done")
