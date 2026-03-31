# 🏨 WAB Hotel Management System

Willkommen beim WAB Hotel Manager – Ihrer modernen Komplettlösung für die Hotelverwaltung, Buchungsübersicht und KPI-Analysen.

## 🚀 Projektstart (Lokal)

Das gesamte Projekt ist vollständig dockerisiert, was das Setup extrem einfach macht.

### Voraussetzungen
*   **Docker Desktop**: Muss auf Ihrem System installiert und **aktiv gestartet** sein.
*   **Git**: Zum Klonen des Repositories.

### Schritt-für-Schritt Start
1.  **Repository klonen**:
    ```bash
    git clone [REPO_URL]
    cd WAB-hotel-Manager
    ```

2.  **Container erstellen und starten**:
    Öffnen Sie ein Terminal im Hauptverzeichnis des Projekts und führen Sie aus:
    ```bash
    docker-compose up -d --build
    ```
    *   `-d`: Startet die Container im Hintergrund (Detached Mode).
    *   `--build`: Stellt sicher, dass alle Änderungen im Code (Backend/Frontend) neu gebaut werden.

3.  **Anwendung aufrufen**:
    Sobald die Container laufen, erreichen Sie das System im Browser unter:
    👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛑 Projekt beenden

Um die Anwendung sicher herunterzufahren:
```bash
docker-compose stop
```

Falls Sie die Container komplett entfernen möchten (Daten in der Datenbank bleiben in den Volumes erhalten):
```bash
docker-compose down
```

## 🛠️ Features & Module

*   **Buchungsübersicht**: Dashboard mit Wochen-Filter und Status-Management.
*   **Gäste-Stamm**: Zentrale Verwaltung Ihrer Gäste inklusive vollständiger **Buchungshistorie**.
*   **Zimmer-Management**: Übersicht aller Zimmer und deren Kategorien.
*   **Rechnungswesen**: Automatische Berechnung von Zimmerpreis, Frühstück und Parkplatz sowie **manuelle Zusatzleistungen** (Minibar, etc.).
*   **Analysen & KPIs**: Echtzeit-Auswertung von RevPAR, ADR, Auslastung und Saisonalen Trends mit Jahresvergleich.

Viel Erfolg bei der Hotelverwaltung! 🛎️