import re

filepath = "frontend/src/app/reservierungen/page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Fix GuestForm initialData.id:
text = text.replace("const isEditing = !!initialData?.id;", "const isEditing = !!initialData?.gast_id; // GUEST_FORM")
text = text.replace("WHERE reservierung_id = ${initialData.reservierung_id}`)", "WHERE gast_id = ${initialData.gast_id}`)")
text = text.replace("return initialData.id;", "return initialData.gast_id;")

# Fix ReservationForm initialData.id:
text = text.replace("const isEditing = !!initialData?.id; // GUEST_FORM", "const isEditing = !!initialData?.gast_id;") # Keep it gast_id for GuestForm
text = text.replace("const isEditing = !!initialData?.id;", "const isEditing = !!initialData?.reservierung_id;") # For ReservationForm

text = text.replace("if (isEditing && initialData?.id) {", "if (isEditing && initialData?.reservierung_id) {")
text = text.replace("WHERE reservierung_id = ${initialData.id}", "WHERE reservierung_id = ${initialData.reservierung_id}")
text = text.replace("}, [isEditing, initialData?.id]);", "}, [isEditing, initialData?.reservierung_id]);")
text = text.replace("WHERE id = ${initialData.id}", "WHERE reservierung_id = ${initialData.reservierung_id}")


# Check editingGuest
text = text.replace("editingGuest?.id === g.gast_id", "editingGuest?.gast_id === g.gast_id")
text = text.replace("editingGuest?.id", "editingGuest?.gast_id")

# Check editingRes
text = text.replace("selectedRes?.id", "selectedRes?.reservierung_id")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)
print("done fixup")
