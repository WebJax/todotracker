# TimeTracker Pro - Opsætningsguide

Dette er en komplet TimeTracker-applikation bygget med PHP, JavaScript (ES6), HTML og CSS.

## Krav
- En webserver (f.eks. Apache, Nginx) med PHP 7.4+
- En MySQL eller MariaDB database
- En browser

## Opsætning

### 1. Database Setup
Kør følgende SQL kommando for at oprette databasen og tabellerne:

```bash
mysql -u root -p < database/schema.sql
```

### 2. Database Konfiguration
Opdater database forbindelsen i `api/Database.php`:

```php
private $host = '127.0.0.1';
private $db_name = 'timetracker';
private $username = 'root';
private $password = 'DIN_ADGANGSKODE';
```

### 1. Database
1.  Opret en ny database i dit databasesystem (f.eks. via phpMyAdmin).
2.  Importér `database.sql` filen ind i den nye database. Dette vil oprette de nødvendige tabeller og indsætte lidt startdata.
3.  Opdater `api/config.php` med dine databaseoplysninger (host, brugernavn, adgangskode, databasenavn).

### 2. Filer
1.  Placer alle filerne fra dette projekt på din webserver i en mappe (f.eks. `/var/www/html/timetracker`).
2.  Sørg for, at din webserver har rettigheder til at læse filerne.

### 3. Kør Applikationen
1.  Åbn din browser og naviger til den URL, hvor du placerede filerne (f.eks. `http://localhost/timetracker`).
2.  Applikationen bør nu loade og være klar til brug.

## Projektstruktur
- `index.html`: Applikationens hovedfil.
- `style.css`: Styling for et moderne, minimalistisk look.
- `js/`: Indeholder al frontend JavaScript-logik.
  - `app.js`: Hovedapplikationen, der initialiserer og styrer flowet.
  - `ApiHandler.js`: Håndterer al kommunikation med backend API'en.
  - `UI.js`: Håndterer al manipulation af DOM (opdatering af brugerfladen).
- `api/`: Indeholder backend PHP API.
  - `index.php`: API-router, der modtager alle requests.
  - `config.php`: Databasekonfiguration. **SKAL OPDATERES**.
  - `Database.php`: PDO-databaseforbindelsesklasse.
  - `TaskController.php`: Indeholder al forretningslogik for opgaver og tidsregistrering.
- `database.sql`: SQL-script til at oprette og populere databasen.