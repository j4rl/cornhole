<?php

require __DIR__ . '/config.php';

session_start();
header('Content-Type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

const TABLE_PREFIX = 'ch_';

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    if (!is_array($data)) {
        respond(['ok' => false, 'error' => 'Ogiltig JSON.'], 400);
    }

    return $data;
}

function db(): mysqli
{
    try {
        $db = new mysqli(DB_HOST, DB_USER, DB_PASS);
        $db->set_charset('utf8mb4');
        $db->query(
            'CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` ' .
            'CHARACTER SET utf8mb4 COLLATE utf8mb4_swedish_ci'
        );
        $db->select_db(DB_NAME);
        ensure_schema($db);

        return $db;
    } catch (Throwable $error) {
        respond(['ok' => false, 'error' => 'Databasfel: ' . $error->getMessage()], 500);
    }
}

function table_name(string $name): string
{
    return TABLE_PREFIX . $name;
}

function qtable(string $name): string
{
    return '`' . table_name($name) . '`';
}

function table_exists(mysqli $db, string $table): bool
{
    $stmt = $db->prepare(
        'SELECT COUNT(*) AS count
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?'
    );
    $schema = DB_NAME;
    $stmt->bind_param('ss', $schema, $table);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return (int)$row['count'] > 0;
}

function column_exists(mysqli $db, string $table, string $column): bool
{
    $stmt = $db->prepare(
        'SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $schema = DB_NAME;
    $stmt->bind_param('sss', $schema, $table, $column);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return (int)$row['count'] > 0;
}

function ensure_schema(mysqli $db): void
{
    migrate_table_prefix($db);

    $accountsTable = qtable('accounts');
    $statsTable = qtable('player_stats');
    $matchesTable = qtable('matches');
    $turnsTable = qtable('turns');

    $db->query(
        "CREATE TABLE IF NOT EXISTS $accountsTable (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(64) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_accounts_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci"
    );

    $db->query(
        "CREATE TABLE IF NOT EXISTS $statsTable (
            account_id INT UNSIGNED NOT NULL,
            player_name VARCHAR(24) NOT NULL,
            games INT UNSIGNED NOT NULL DEFAULT 0,
            wins INT UNSIGNED NOT NULL DEFAULT 0,
            losses INT UNSIGNED NOT NULL DEFAULT 0,
            tournament_wins INT UNSIGNED NOT NULL DEFAULT 0,
            points INT UNSIGNED NOT NULL DEFAULT 0,
            holes INT UNSIGNED NOT NULL DEFAULT 0,
            boards INT UNSIGNED NOT NULL DEFAULT 0,
            ground INT UNSIGNED NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (account_id, player_name),
            CONSTRAINT fk_player_stats_account
              FOREIGN KEY (account_id) REFERENCES $accountsTable (id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci"
    );

    $db->query(
        "CREATE TABLE IF NOT EXISTS $matchesTable (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            account_id INT UNSIGNED NULL,
            winner_name VARCHAR(24) NOT NULL,
            winner_score TINYINT UNSIGNED NOT NULL,
            loser_name VARCHAR(24) NOT NULL,
            loser_score TINYINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_matches_created_at (created_at),
            INDEX idx_matches_account_id (account_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci"
    );

    $db->query(
        "CREATE TABLE IF NOT EXISTS $turnsTable (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            match_id BIGINT UNSIGNED NOT NULL,
            turn_order INT UNSIGNED NOT NULL,
            player_name VARCHAR(24) NOT NULL,
            points TINYINT UNSIGNED NOT NULL,
            holes TINYINT UNSIGNED NOT NULL,
            boards TINYINT UNSIGNED NOT NULL,
            ground TINYINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_turns_match_id (match_id),
            CONSTRAINT fk_turns_match
              FOREIGN KEY (match_id) REFERENCES $matchesTable (id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci"
    );

    if (!column_exists($db, table_name('matches'), 'account_id')) {
        $db->query("ALTER TABLE $matchesTable ADD COLUMN account_id INT UNSIGNED NULL AFTER id");
    }

    if (!column_exists($db, table_name('player_stats'), 'tournament_wins')) {
        $db->query("ALTER TABLE $statsTable ADD COLUMN tournament_wins INT UNSIGNED NOT NULL DEFAULT 0 AFTER losses");
    }

    if (column_exists($db, table_name('matches'), 'winner_user_id')) {
        $db->query("ALTER TABLE $matchesTable DROP COLUMN winner_user_id");
    }

    if (column_exists($db, table_name('matches'), 'loser_user_id')) {
        $db->query("ALTER TABLE $matchesTable DROP COLUMN loser_user_id");
    }

    if (column_exists($db, table_name('turns'), 'user_id')) {
        $db->query("ALTER TABLE $turnsTable DROP COLUMN user_id");
    }
}

function migrate_table_prefix(mysqli $db): void
{
    foreach (['turns', 'player_stats', 'matches', 'accounts', 'users'] as $table) {
        $prefixed = table_name($table);

        if (table_exists($db, $table) && !table_exists($db, $prefixed)) {
            $db->query('RENAME TABLE `' . $table . '` TO `' . $prefixed . '`');
        }
    }
}

function account_id(): ?int
{
    return isset($_SESSION['account_id']) ? (int)$_SESSION['account_id'] : null;
}

function stats_for_account(mysqli $db, int $accountId): array
{
    $stmt = $db->prepare(
        'SELECT player_name, games, wins, losses, tournament_wins, points, holes, boards, ground
         FROM ' . qtable('player_stats') . '
         WHERE account_id = ?
         ORDER BY player_name'
    );
    $stmt->bind_param('i', $accountId);
    $stmt->execute();

    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function session_payload(mysqli $db): array
{
    $accountId = account_id();
    if ($accountId === null) {
        return ['ok' => true, 'account' => null, 'playerStats' => []];
    }

    $stmt = $db->prepare('SELECT id, username FROM ' . qtable('accounts') . ' WHERE id = ?');
    $stmt->bind_param('i', $accountId);
    $stmt->execute();
    $account = $stmt->get_result()->fetch_assoc();

    if (!$account) {
        unset($_SESSION['account_id']);
        return ['ok' => true, 'account' => null, 'playerStats' => []];
    }

    return [
        'ok' => true,
        'account' => ['id' => (int)$account['id'], 'username' => $account['username']],
        'playerStats' => stats_for_account($db, (int)$account['id']),
    ];
}

function validate_username(string $username): string
{
    $username = trim($username);

    if ($username === '' || mb_strlen($username) > 64) {
        respond(['ok' => false, 'error' => 'Användarnamnet måste vara 1-64 tecken.'], 422);
    }

    return $username;
}

function validate_password(string $password): string
{
    if (mb_strlen($password) < 4) {
        respond(['ok' => false, 'error' => 'Lösenordet måste vara minst 4 tecken.'], 422);
    }

    return $password;
}

function register_account(mysqli $db): void
{
    $body = read_body();
    $username = validate_username((string)($body['username'] ?? ''));
    $password = validate_password((string)($body['password'] ?? ''));
    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare('INSERT INTO ' . qtable('accounts') . ' (username, password_hash) VALUES (?, ?)');
        $stmt->bind_param('ss', $username, $hash);
        $stmt->execute();
    } catch (mysqli_sql_exception $error) {
        if ((int)$error->getCode() === 1062) {
            respond(['ok' => false, 'error' => 'Användaren finns redan.'], 409);
        }

        throw $error;
    }

    $_SESSION['account_id'] = $db->insert_id;
    respond(session_payload($db), 201);
}

function login_account(mysqli $db): void
{
    $body = read_body();
    $username = validate_username((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $stmt = $db->prepare('SELECT id, password_hash FROM ' . qtable('accounts') . ' WHERE username = ?');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $account = $stmt->get_result()->fetch_assoc();

    if (!$account || !password_verify($password, $account['password_hash'])) {
        respond(['ok' => false, 'error' => 'Fel användarnamn eller lösenord.'], 401);
    }

    $_SESSION['account_id'] = (int)$account['id'];
    respond(session_payload($db));
}

function logout_account(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
    respond(['ok' => true]);
}

function int_value(mixed $value, int $min, int $max): int
{
    if (!is_int($value) && !ctype_digit((string)$value)) {
        respond(['ok' => false, 'error' => 'Ogiltigt numeriskt värde.'], 422);
    }

    $number = (int)$value;
    if ($number < $min || $number > $max) {
        respond(['ok' => false, 'error' => 'Värde utanför tillåtet intervall.'], 422);
    }

    return $number;
}

function save_match(mysqli $db): void
{
    $body = read_body();
    $players = $body['players'] ?? [];
    $history = $body['history'] ?? [];
    $winnerId = (string)($body['winnerId'] ?? '');
    $isTournamentWin = (bool)($body['tournamentWin'] ?? false);

    if (!is_array($players) || count($players) < 2 || !is_array($history) || $winnerId === '') {
        respond(['ok' => false, 'error' => 'Matchen saknar spelare, historik eller vinnare.'], 422);
    }

    $normalizedPlayers = [];
    foreach ($players as $player) {
        if (!is_array($player)) {
            respond(['ok' => false, 'error' => 'Ogiltig spelare.'], 422);
        }

        $id = (string)($player['id'] ?? '');
        $name = trim((string)($player['name'] ?? ''));
        $score = int_value($player['score'] ?? -1, 0, 40);

        if ($id === '' || $name === '' || mb_strlen($name) > 24) {
            respond(['ok' => false, 'error' => 'Ogiltigt spelarnamn.'], 422);
        }

        $normalizedPlayers[$id] = [
            'id' => $id,
            'name' => $name,
            'score' => $score,
        ];
    }

    if (count($normalizedPlayers) < 2) {
        respond(['ok' => false, 'error' => 'Matchen måste ha minst två unika spelare.'], 422);
    }

    if (!isset($normalizedPlayers[$winnerId])) {
        respond(['ok' => false, 'error' => 'Vinnaren finns inte i matchen.'], 422);
    }

    $winner = $normalizedPlayers[$winnerId];
    $losers = array_values(array_filter(
        $normalizedPlayers,
        fn (array $player): bool => $player['id'] !== $winnerId
    ));
    usort(
        $losers,
        fn (array $left, array $right): int => $right['score'] <=> $left['score']
    );
    $loser = $losers[0];

    $accountId = account_id();
    $db->begin_transaction();

    try {
        $winnerName = $winner['name'];
        $winnerScore = $winner['score'];
        $loserName = $loser['name'];
        $loserScore = $loser['score'];

        $stmt = $db->prepare(
            'INSERT INTO ' . qtable('matches') . '
              (account_id, winner_name, winner_score, loser_name, loser_score)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'isisi',
            $accountId,
            $winnerName,
            $winnerScore,
            $loserName,
            $loserScore
        );
        $stmt->execute();
        $matchId = $db->insert_id;

        $turnStmt = $db->prepare(
            'INSERT INTO ' . qtable('turns') . '
              (match_id, turn_order, player_name, points, holes, boards, ground)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        $stats = [];

        foreach (array_values($history) as $index => $entry) {
            if (!is_array($entry)) {
                respond(['ok' => false, 'error' => 'Ogiltig turhistorik.'], 422);
            }

            $playerId = (string)($entry['playerId'] ?? '');
            if (!isset($normalizedPlayers[$playerId])) {
                respond(['ok' => false, 'error' => 'Turen hör till okänd spelare.'], 422);
            }

            $player = $normalizedPlayers[$playerId];
            $points = int_value($entry['points'] ?? -1, 0, 9);
            $holes = int_value($entry['holes'] ?? -1, 0, 3);
            $boards = int_value($entry['boards'] ?? -1, 0, 3);
            $ground = int_value($entry['ground'] ?? -1, 0, 3);

            if ($holes + $boards + $ground !== 3 || $points !== ($holes * 3 + $boards)) {
                respond(['ok' => false, 'error' => 'Turen har fel poäng eller antal påsar.'], 422);
            }

            $turnOrder = $index + 1;
            $playerName = $player['name'];
            $turnStmt->bind_param(
                'iisiiii',
                $matchId,
                $turnOrder,
                $playerName,
                $points,
                $holes,
                $boards,
                $ground
            );
            $turnStmt->execute();

            if ($accountId !== null) {
                $stats[$playerName] ??= ['holes' => 0, 'boards' => 0, 'ground' => 0];
                $stats[$playerName]['holes'] += $holes;
                $stats[$playerName]['boards'] += $boards;
                $stats[$playerName]['ground'] += $ground;
            }
        }

        if ($accountId !== null) {
            $statsStmt = $db->prepare(
                'INSERT INTO ' . qtable('player_stats') . '
                  (account_id, player_name, games, wins, losses, tournament_wins, points, holes, boards, ground)
                 VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   games = games + 1,
                   wins = wins + VALUES(wins),
                   losses = losses + VALUES(losses),
                   tournament_wins = tournament_wins + VALUES(tournament_wins),
                   points = points + VALUES(points),
                   holes = holes + VALUES(holes),
                   boards = boards + VALUES(boards),
                   ground = ground + VALUES(ground)'
            );

            foreach ($normalizedPlayers as $player) {
                $playerName = $player['name'];
                $wins = $player['id'] === $winnerId ? 1 : 0;
                $losses = $player['id'] === $winnerId ? 0 : 1;
                $tournamentWins = $player['id'] === $winnerId && $isTournamentWin ? 1 : 0;
                $points = $player['score'];
                $playerStats = $stats[$playerName] ?? ['holes' => 0, 'boards' => 0, 'ground' => 0];
                $holes = $playerStats['holes'];
                $boards = $playerStats['boards'];
                $ground = $playerStats['ground'];

                $statsStmt->bind_param(
                    'isiiiiiii',
                    $accountId,
                    $playerName,
                    $wins,
                    $losses,
                    $tournamentWins,
                    $points,
                    $holes,
                    $boards,
                    $ground
                );
                $statsStmt->execute();
            }
        }

        $db->commit();
        respond(['ok' => true, 'matchId' => $matchId], 201);
    } catch (Throwable $error) {
        $db->rollback();
        respond(['ok' => false, 'error' => 'Kunde inte spara match: ' . $error->getMessage()], 500);
    }
}

$db = db();
$action = (string)($_GET['action'] ?? 'session');
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'session' && $method === 'GET') {
    respond(session_payload($db));
}

if ($action === 'register' && $method === 'POST') {
    register_account($db);
}

if ($action === 'login' && $method === 'POST') {
    login_account($db);
}

if ($action === 'logout' && $method === 'POST') {
    logout_account();
}

if ($action === 'matches' && $method === 'POST') {
    save_match($db);
}

respond(['ok' => false, 'error' => 'Okänd endpoint.'], 404);
