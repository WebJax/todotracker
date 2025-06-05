# Timetracker Prototype

En simpel timetracker applikation bygget med HTML, ES6 JavaScript, Tailwind CSS og PHP.

## Funktioner

- **Dagsvisning**: Vælg dato eller brug dagens dato som standard
- **Opgave-håndtering**: Tilføj og fjern opgaver dynamisk
- **Opgave-felter**: 
  - Tekstfelt til opgavetitel
  - Nummerfelt til tid (i minutter)
  - Tekstfelt til kommentarer
- **Automatisk summering**: Se total tid i minutter og timer/minutter
- **Gem/Hent data**: Backend gemmer data som JSON-filer

## Dataformat

Hver dag gemmes som en JSON-fil i `/data/` mappen med følgende format:

```json
{
  "date": "2025-06-05",
  "tasks": [
    {
      "title": "Udvikling af plugin",
      "time": 150,
      "comment": "Det gik godt"
    },
    {
      "title": "Afmelde abonnement", 
      "time": 4,
      "comment": "Husk screenshot"
    }
  ],
  "saved_at": "2025-06-05 14:30:00",
  "total_minutes": 154
}
```

## Filer

- `index.html` - Frontend applikation
- `save_tasks.php` - Backend til at gemme opgaver
- `load_tasks.php` - Backend til at hente opgaver
- `data/` - Mappe hvor daglige JSON-filer gemmes

## Installation

1. Placér filerne i en mappe på din webserver
2. Sørg for at PHP er aktiveret
3. Giv skrivetilladelser til `data/` mappen
4. Åbn `index.html` i din browser

## Sikkerhed

- Input validering på både frontend og backend
- JSON data sanitization
- Beskyttelse mod XSS-angreb
- File locking ved skrivning
- CORS headers for lokal udvikling

## Browser Support

- Moderne browsers med ES6 support
- Responsive design for mobile og desktop
