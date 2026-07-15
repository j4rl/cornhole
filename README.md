# Cornhole

Mobilanpassad poängräknare för Cornhole.

## Regler i appen

- Först till 21 poäng vinner matchen.
- Varje spelare har 3 kast per tur.
- `Hål` ger 3 poäng, `Bräda` ger 1 poäng och `Miss` ger 0 poäng.
- Man kan spela tvåspelarmatch och flerpersonsmatch utan konto, men statistik sparas bara när ett konto är inloggat.
- Flerpersonsmatch fungerar som en vanlig match med fler än två spelare: alla turas om och första spelaren till 21 vinner.
- När ett konto är inloggat kan fler än två spelarnamn starta en turnering där spelarna fortsätter spela tills alla placeringar är avgjorda.
- Statistik sparas per spelarnamn under det inloggade kontot.
- Varje färdig match i en turnering sparas i statistiken. Matchen om plats 1-2 markeras även som turneringsvinst.

## Körning

Placera projektet under XAMPP:s `htdocs` och öppna:

```text
http://localhost/cornhole/
```

Appen använder `api.php`, PHP-sessioner och MySQL via `mysqli`. PDO används inte.

## Databas

Standardinställningar finns i `config.php`:

```php
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'cornhole';
```

`api.php` skapar databasen och tabellerna automatiskt om MySQL-användaren har rättigheter.
Tabellerna använder prefixet `ch_`, till exempel `ch_accounts`, `ch_matches`, `ch_turns` och `ch_player_stats`.
