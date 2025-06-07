<?php
// -- DATABASE INDSTILLINGER --
// Udfyld disse med dine egne oplysninger
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Din databasebruger
define('DB_PASS', '');     // Din databaseadgangskode
define('DB_NAME', 'timetracker'); // Dit databasenavn

// -- TIDSZONE --
// Vigtigt for korrekte datoberegninger
date_default_timezone_set('Europe/Copenhagen');
?>