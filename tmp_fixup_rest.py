import re

# -------------
# Mitarbeiter
# -------------
filepath_m = "frontend/src/app/mitarbeiter/page.tsx"
with open(filepath_m, "r", encoding="utf-8") as f:
    text_m = f.read()

text_m = text_m.replace("type Mitarbeiter = {\n  id: number;", "type Mitarbeiter = {\n  mitarbeiter_id: number;")
text_m = text_m.replace("type Status = {\n  id: number;", "type Status = {\n  status_id: number;")

# SQL Queries
text_m = text_m.replace("SELECT m.id,", "SELECT m.mitarbeiter_id,")
text_m = text_m.replace("m.id = w.mitarbeiter_id", "m.mitarbeiter_id = w.mitarbeiter_id")
text_m = text_m.replace("GROUP BY m.id", "GROUP BY m.mitarbeiter_id")
text_m = text_m.replace("ORDER BY m.id ASC", "ORDER BY m.mitarbeiter_id ASC")

text_m = text_m.replace("SELECT id, name FROM Status", "SELECT status_id, name FROM Status")

# JS access
text_m = re.sub(r'\bemp\.id\b', 'emp.mitarbeiter_id', text_m)
text_m = re.sub(r'\bs\.id\b', 's.status_id', text_m)
text_m = re.sub(r'\bstatus\.id\b', 'status.status_id', text_m)
text_m = re.sub(r'\binitialData\.id\b', 'initialData.mitarbeiter_id', text_m)
text_m = text_m.replace("WHERE id = ${initialData.mitarbeiter_id}", "WHERE mitarbeiter_id = ${initialData.mitarbeiter_id}")
text_m = text_m.replace("DELETE FROM Mitarbeiter WHERE id = ${id}", "DELETE FROM Mitarbeiter WHERE mitarbeiter_id = ${id}")
text_m = text_m.replace("WHERE id = ${id}", "WHERE mitarbeiter_id = ${id}")
text_m = text_m.replace("RETURNING id", "RETURNING mitarbeiter_id")
text_m = text_m.replace("SELECT id FROM", "SELECT mitarbeiter_id FROM")
text_m = text_m.replace("isEditing = !!initialData?.mitarbeiter_id", "isEditing = !!initialData?.mitarbeiter_id")
text_m = text_m.replace("initialData?.id", "initialData?.mitarbeiter_id")
text_m = text_m.replace("editingEmployee?.id", "editingEmployee?.mitarbeiter_id")


with open(filepath_m, "w", encoding="utf-8") as f:
    f.write(text_m)


# -------------
# Analysen
# -------------
filepath_a = "frontend/src/app/analysen/page.tsx"
with open(filepath_a, "r", encoding="utf-8") as f:
    text_a = f.read()

text_a = text_a.replace("r.id,", "r.reservierung_id,")
text_a = text_a.replace("zl.reservierung_id = r.id", "zl.reservierung_id = r.reservierung_id")
text_a = text_a.replace("z.zimmer_id = z.id", "z.zimmer_id = z.zimmer_id") # Note: old was r.zimmer_id = z.id actually, let's just do regex
text_a = re.sub(r'\br\.zimmer_id = z\.id\b', 'r.zimmer_id = z.zimmer_id', text_a)
text_a = re.sub(r'\bkategorie_id = k\.id\b', 'kategorie_id = k.kategorie_id', text_a)

with open(filepath_a, "w", encoding="utf-8") as f:
    f.write(text_a)

print("done rest")
