-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Värd: 127.0.0.1
-- Tid vid skapande: 01 jul 2026 kl 11:39
-- Serverversion: 10.4.32-MariaDB
-- PHP-version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databas: `cornhole`
--

-- --------------------------------------------------------

--
-- Tabellstruktur `ch_accounts`
--

CREATE TABLE `ch_accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci;

--
-- Dumpning av Data i tabell `ch_accounts`
--

INSERT INTO `ch_accounts` (`id`, `username`, `password_hash`, `created_at`) VALUES
(2, 'j4rl', '$2y$10$.CXQF4E5MIDMXlIeshP6duiJGechMNxCAIHalq7iyq2ckLBdHyx16', '2026-07-01 09:17:32');

-- --------------------------------------------------------

--
-- Tabellstruktur `ch_matches`
--

CREATE TABLE `ch_matches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED DEFAULT NULL,
  `winner_name` varchar(24) NOT NULL,
  `winner_score` tinyint(3) UNSIGNED NOT NULL,
  `loser_name` varchar(24) NOT NULL,
  `loser_score` tinyint(3) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci;

--
-- Dumpning av Data i tabell `ch_matches`
--

INSERT INTO `ch_matches` (`id`, `account_id`, `winner_name`, `winner_score`, `loser_name`, `loser_score`, `created_at`) VALUES
(4, NULL, 'jrnny', 24, 'charlie', 11, '2026-07-01 09:03:13'),
(7, NULL, 'Jenny', 21, 'Charlie', 13, '2026-07-01 09:11:45'),
(8, 2, 'Anna', 23, 'Bertil', 13, '2026-07-01 09:18:34'),
(9, 2, 'David', 24, 'Cecilia', 18, '2026-07-01 09:19:12'),
(10, 2, 'Anna', 23, 'David', 18, '2026-07-01 09:19:37');

-- --------------------------------------------------------

--
-- Tabellstruktur `ch_player_stats`
--

CREATE TABLE `ch_player_stats` (
  `account_id` int(10) UNSIGNED NOT NULL,
  `player_name` varchar(24) NOT NULL,
  `games` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `wins` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `losses` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `tournament_wins` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `holes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `boards` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `ground` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci;

--
-- Dumpning av Data i tabell `ch_player_stats`
--

INSERT INTO `ch_player_stats` (`account_id`, `player_name`, `games`, `wins`, `losses`, `tournament_wins`, `points`, `holes`, `boards`, `ground`, `updated_at`) VALUES
(2, 'Anna', 2, 2, 0, 0, 46, 12, 10, 5, '2026-07-01 09:19:37'),
(2, 'Bertil', 1, 0, 1, 0, 13, 3, 4, 2, '2026-07-01 09:18:34'),
(2, 'Cecilia', 1, 0, 1, 0, 18, 3, 9, 3, '2026-07-01 09:19:12'),
(2, 'David', 2, 1, 1, 0, 42, 10, 12, 5, '2026-07-01 09:19:37');

-- --------------------------------------------------------

--
-- Tabellstruktur `ch_turns`
--

CREATE TABLE `ch_turns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `match_id` bigint(20) UNSIGNED NOT NULL,
  `turn_order` int(10) UNSIGNED NOT NULL,
  `player_name` varchar(24) NOT NULL,
  `points` tinyint(3) UNSIGNED NOT NULL,
  `holes` tinyint(3) UNSIGNED NOT NULL,
  `boards` tinyint(3) UNSIGNED NOT NULL,
  `ground` tinyint(3) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci;

--
-- Dumpning av Data i tabell `ch_turns`
--

INSERT INTO `ch_turns` (`id`, `match_id`, `turn_order`, `player_name`, `points`, `holes`, `boards`, `ground`, `created_at`) VALUES
(14, 4, 1, 'jrnny', 7, 2, 1, 0, '2026-07-01 09:03:13'),
(15, 4, 2, 'charlie', 5, 1, 2, 0, '2026-07-01 09:03:13'),
(16, 4, 3, 'jrnny', 9, 3, 0, 0, '2026-07-01 09:03:13'),
(17, 4, 4, 'charlie', 2, 0, 2, 1, '2026-07-01 09:03:13'),
(18, 4, 5, 'jrnny', 4, 1, 1, 1, '2026-07-01 09:03:13'),
(19, 4, 6, 'charlie', 4, 1, 1, 1, '2026-07-01 09:03:13'),
(20, 4, 7, 'jrnny', 4, 1, 1, 1, '2026-07-01 09:03:13'),
(31, 7, 1, 'Jenny', 2, 0, 2, 1, '2026-07-01 09:11:45'),
(32, 7, 2, 'Charlie', 5, 1, 2, 0, '2026-07-01 09:11:45'),
(33, 7, 3, 'Jenny', 3, 0, 3, 0, '2026-07-01 09:11:45'),
(34, 7, 4, 'Charlie', 1, 0, 1, 2, '2026-07-01 09:11:45'),
(35, 7, 5, 'Jenny', 7, 2, 1, 0, '2026-07-01 09:11:45'),
(36, 7, 6, 'Charlie', 7, 2, 1, 0, '2026-07-01 09:11:45'),
(37, 7, 7, 'Jenny', 9, 3, 0, 0, '2026-07-01 09:11:45'),
(38, 8, 1, 'Anna', 5, 1, 2, 0, '2026-07-01 09:18:34'),
(39, 8, 2, 'Bertil', 5, 1, 2, 0, '2026-07-01 09:18:34'),
(40, 8, 3, 'Anna', 7, 2, 1, 0, '2026-07-01 09:18:34'),
(41, 8, 4, 'Bertil', 1, 0, 1, 2, '2026-07-01 09:18:34'),
(42, 8, 5, 'Anna', 4, 1, 1, 1, '2026-07-01 09:18:34'),
(43, 8, 6, 'Bertil', 7, 2, 1, 0, '2026-07-01 09:18:34'),
(44, 8, 7, 'Anna', 7, 2, 1, 0, '2026-07-01 09:18:34'),
(45, 9, 1, 'Cecilia', 5, 1, 2, 0, '2026-07-01 09:19:12'),
(46, 9, 2, 'David', 2, 0, 2, 1, '2026-07-01 09:19:12'),
(47, 9, 3, 'Cecilia', 5, 1, 2, 0, '2026-07-01 09:19:12'),
(48, 9, 4, 'David', 4, 1, 1, 1, '2026-07-01 09:19:12'),
(49, 9, 5, 'Cecilia', 4, 1, 1, 1, '2026-07-01 09:19:12'),
(50, 9, 6, 'David', 6, 2, 0, 1, '2026-07-01 09:19:12'),
(51, 9, 7, 'Cecilia', 2, 0, 2, 1, '2026-07-01 09:19:12'),
(52, 9, 8, 'David', 7, 2, 1, 0, '2026-07-01 09:19:12'),
(53, 9, 9, 'Cecilia', 2, 0, 2, 1, '2026-07-01 09:19:12'),
(54, 9, 10, 'David', 5, 1, 2, 0, '2026-07-01 09:19:12'),
(55, 10, 1, 'Anna', 4, 1, 1, 1, '2026-07-01 09:19:37'),
(56, 10, 2, 'David', 5, 1, 2, 0, '2026-07-01 09:19:37'),
(57, 10, 3, 'Anna', 1, 0, 1, 2, '2026-07-01 09:19:37'),
(58, 10, 4, 'David', 5, 1, 2, 0, '2026-07-01 09:19:37'),
(59, 10, 5, 'Anna', 6, 2, 0, 1, '2026-07-01 09:19:37'),
(60, 10, 6, 'David', 4, 1, 1, 1, '2026-07-01 09:19:37'),
(61, 10, 7, 'Anna', 5, 1, 2, 0, '2026-07-01 09:19:37'),
(62, 10, 8, 'David', 4, 1, 1, 1, '2026-07-01 09:19:37'),
(63, 10, 9, 'Anna', 7, 2, 1, 0, '2026-07-01 09:19:37');

-- --------------------------------------------------------

--
-- Tabellstruktur `ch_users`
--

CREATE TABLE `ch_users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(24) NOT NULL,
  `games` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `wins` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `losses` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `holes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `boards` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `ground` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_swedish_ci;

--
-- Index för dumpade tabeller
--

--
-- Index för tabell `ch_accounts`
--
ALTER TABLE `ch_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_accounts_username` (`username`);

--
-- Index för tabell `ch_matches`
--
ALTER TABLE `ch_matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_matches_created_at` (`created_at`);

--
-- Index för tabell `ch_player_stats`
--
ALTER TABLE `ch_player_stats`
  ADD PRIMARY KEY (`account_id`,`player_name`);

--
-- Index för tabell `ch_turns`
--
ALTER TABLE `ch_turns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_turns_match_id` (`match_id`);

--
-- Index för tabell `ch_users`
--
ALTER TABLE `ch_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_name` (`name`);

--
-- AUTO_INCREMENT för dumpade tabeller
--

--
-- AUTO_INCREMENT för tabell `ch_accounts`
--
ALTER TABLE `ch_accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT för tabell `ch_matches`
--
ALTER TABLE `ch_matches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT för tabell `ch_turns`
--
ALTER TABLE `ch_turns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT för tabell `ch_users`
--
ALTER TABLE `ch_users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restriktioner för dumpade tabeller
--

--
-- Restriktioner för tabell `ch_player_stats`
--
ALTER TABLE `ch_player_stats`
  ADD CONSTRAINT `fk_player_stats_account` FOREIGN KEY (`account_id`) REFERENCES `ch_accounts` (`id`) ON DELETE CASCADE;

--
-- Restriktioner för tabell `ch_turns`
--
ALTER TABLE `ch_turns`
  ADD CONSTRAINT `fk_turns_match` FOREIGN KEY (`match_id`) REFERENCES `ch_matches` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
