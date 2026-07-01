# Cornhole

Mobilanpassad poängräknare för Cornhole.

## Regler i appen

- Först till 21 poäng vinner matchen.
- Varje spelare har 3 kast per tur.
- `Hål` ger 3 poäng, `Bräda` ger 1 poäng och `Miss` ger 0 poäng.
- Man kan spela tvåspelarmatch utan konto, men statistik sparas bara när ett konto är inloggat.
- När ett konto är inloggat kan fler än två spelarnamn anges, ett namn per rad, vilket startar slutspel med final.
- Statistik sparas per spelarnamn under det inloggade kontot.

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
