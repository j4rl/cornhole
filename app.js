const API_URL = "api.php";
const MAX_THROWS = 3;
const WINNING_SCORE = 21;

const THROW_RESULTS = {
  hole: { label: "Hål", points: 3, stat: "holes" },
  board: { label: "Bräda", points: 1, stat: "boards" },
  miss: { label: "Miss", points: 0, stat: "ground" },
};

const defaultStats = () => ({
  games: 0,
  wins: 0,
  losses: 0,
  points: 0,
  holes: 0,
  boards: 0,
  ground: 0,
});

const state = {
  account: null,
  playerStats: [],
  game: null,
  tournament: null,
  nextDialogAction: null,
  nextTournamentMatch: null,
  turnInput: [],
};

const els = {
  apiNotice: document.querySelector("#apiNotice"),
  setupView: document.querySelector("#setupView"),
  registerView: document.querySelector("#registerView"),
  gameView: document.querySelector("#gameView"),
  statsView: document.querySelector("#statsView"),
  setupForm: document.querySelector("#setupForm"),
  playerNames: document.querySelector("#playerNames"),
  accountStatus: document.querySelector("#accountStatus"),
  loginButton: document.querySelector("#loginButton"),
  createAccountButton: document.querySelector("#createAccountButton"),
  logoutButton: document.querySelector("#logoutButton"),
  authDialog: document.querySelector("#authDialog"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  closeRegisterButton: document.querySelector("#closeRegisterButton"),
  statsButton: document.querySelector("#statsButton"),
  closeStatsButton: document.querySelector("#closeStatsButton"),
  backToSetupButton: document.querySelector("#backToSetupButton"),
  gameContext: document.querySelector("#gameContext"),
  bracketView: document.querySelector("#bracketView"),
  scoreboard: document.querySelector("#scoreboard"),
  turnPlayer: document.querySelector("#turnPlayer"),
  throwTrack: document.querySelector("#throwTrack"),
  throwsDone: document.querySelector("#throwsDone"),
  turnPoints: document.querySelector("#turnPoints"),
  undoThrowButton: document.querySelector("#undoThrowButton"),
  undoButton: document.querySelector("#undoButton"),
  newGameButton: document.querySelector("#newGameButton"),
  historyList: document.querySelector("#historyList"),
  statsList: document.querySelector("#statsList"),
  winnerDialog: document.querySelector("#winnerDialog"),
  winnerTitle: document.querySelector("#winnerTitle"),
  winnerText: document.querySelector("#winnerText"),
  dialogSetupButton: document.querySelector("#dialogSetupButton"),
  dialogReplayButton: document.querySelector("#dialogReplayButton"),
};

async function api(action, options = {}) {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    error: "Servern svarade inte med JSON.",
  }));

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Okänt API-fel.");
  }

  return payload;
}

function showNotice(message, isError = false) {
  els.apiNotice.textContent = message;
  els.apiNotice.classList.toggle("is-error", isError);
  els.apiNotice.hidden = false;
}

function clearNotice() {
  els.apiNotice.hidden = true;
  els.apiNotice.textContent = "";
  els.apiNotice.classList.remove("is-error");
}

function normalizeStats(row) {
  return {
    name: row.player_name,
    stats: {
      ...defaultStats(),
      games: Number(row.games ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      points: Number(row.points ?? 0),
      holes: Number(row.holes ?? 0),
      boards: Number(row.boards ?? 0),
      ground: Number(row.ground ?? 0),
    },
  };
}

async function loadSession() {
  try {
    const payload = await api("session");
    state.account = payload.account || null;
    state.playerStats = (payload.playerStats || []).map(normalizeStats);
    renderAccount();
    renderStats();
    clearNotice();
  } catch (error) {
    showNotice(error.message, true);
    renderAccount();
    renderStats();
  }
}

function renderAccount() {
  if (state.account) {
    els.accountStatus.textContent = state.account.username;
    els.loginButton.hidden = true;
    els.createAccountButton.hidden = true;
    els.logoutButton.hidden = false;
    return;
  }

  els.accountStatus.textContent = "Spelar utan konto";
  els.loginButton.hidden = false;
  els.createAccountButton.hidden = false;
  els.logoutButton.hidden = true;
}

function showView(view) {
  [els.setupView, els.registerView, els.gameView, els.statsView].forEach((node) => {
    node.classList.toggle("is-active", node === view);
  });
}

function parsePlayerNames() {
  const names = els.playerNames.value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const seen = new Set();
  const unique = [];

  for (const name of names) {
    const key = name.toLocaleLowerCase("sv-SE");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }

  return unique;
}

function createPlayers(names) {
  return names.map((name, index) => ({
    id: `player-${index}-${crypto.randomUUID()}`,
    name,
    score: 0,
  }));
}

function startGame(players, options = {}) {
  state.game = {
    players: players.map((player) => ({ ...player, score: 0 })),
    activeIndex: 0,
    history: [],
    winnerId: null,
    mode: options.mode || "quick",
    context: options.context || "Aktiv match",
    tournamentMatchId: options.tournamentMatchId || null,
  };
  resetTurnInput();
  renderGame();
  showView(els.gameView);
}

function resetTurnInput() {
  state.turnInput = [];
}

function turnCounts(throws = state.turnInput) {
  return throws.reduce(
    (counts, throwType) => {
      counts[THROW_RESULTS[throwType].stat] += 1;
      return counts;
    },
    { holes: 0, boards: 0, ground: 0 },
  );
}

function currentTurnPoints(throws = state.turnInput) {
  return throws.reduce((sum, throwType) => sum + THROW_RESULTS[throwType].points, 0);
}

function renderGame() {
  if (!state.game) return;

  els.gameContext.textContent = state.game.context;

  els.scoreboard.replaceChildren(
    ...state.game.players.map((player, index) => {
      const card = document.createElement("article");
      card.className = `score-card${index === state.game.activeIndex ? " is-active" : ""}`;

      const name = document.createElement("span");
      name.textContent = player.name;

      const score = document.createElement("strong");
      score.textContent = player.score;

      card.append(name, score);
      return card;
    }),
  );

  const activePlayer = state.game.players[state.game.activeIndex];
  els.turnPlayer.textContent = activePlayer.name;
  els.throwsDone.textContent = `${state.turnInput.length}/${MAX_THROWS}`;
  els.turnPoints.textContent = currentTurnPoints();
  els.undoThrowButton.disabled = state.turnInput.length === 0 || Boolean(state.game.winnerId);
  els.undoButton.disabled = state.game.history.length === 0 || Boolean(state.game.winnerId);

  document.querySelectorAll("[data-throw]").forEach((button) => {
    button.disabled = state.turnInput.length >= MAX_THROWS || Boolean(state.game.winnerId);
  });

  els.throwTrack.replaceChildren(
    ...Array.from({ length: MAX_THROWS }, (_, index) => {
      const pill = document.createElement("span");
      pill.className = "throw-pill";
      const throwType = state.turnInput[index];
      if (throwType) {
        pill.classList.add("is-filled");
        pill.textContent = THROW_RESULTS[throwType].label;
      } else {
        pill.textContent = `Kast ${index + 1}`;
      }
      return pill;
    }),
  );

  els.historyList.replaceChildren(
    ...state.game.history.map((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = entry.playerName;
      item.append(name, ` +${entry.points} (${entry.holes} hål, ${entry.boards} bräda, ${entry.ground} miss)`);
      return item;
    }).reverse(),
  );

  renderBracket();
}

function recordThrow(throwType) {
  if (!state.game || state.game.winnerId || state.turnInput.length >= MAX_THROWS) return;

  state.turnInput.push(throwType);
  renderGame();

  if (state.turnInput.length === MAX_THROWS) {
    window.setTimeout(saveTurn, 180);
  }
}

function undoThrow() {
  if (!state.game || state.game.winnerId || state.turnInput.length === 0) return;
  state.turnInput.pop();
  renderGame();
}

function saveTurn() {
  if (!state.game || state.game.winnerId || state.turnInput.length !== MAX_THROWS) return;

  const activePlayer = state.game.players[state.game.activeIndex];
  const points = currentTurnPoints();
  const counts = turnCounts();
  activePlayer.score += points;

  const entry = {
    playerId: activePlayer.id,
    playerName: activePlayer.name,
    points,
    holes: counts.holes,
    boards: counts.boards,
    ground: counts.ground,
  };

  state.game.history.push(entry);

  if (activePlayer.score >= WINNING_SCORE) {
    state.game.winnerId = activePlayer.id;
    finishGame(activePlayer);
  } else {
    state.game.activeIndex = (state.game.activeIndex + 1) % state.game.players.length;
    resetTurnInput();
    renderGame();
  }
}

function undoTurn() {
  if (!state.game || state.game.history.length === 0 || state.game.winnerId) return;

  const entry = state.game.history.pop();
  const playerIndex = state.game.players.findIndex((player) => player.id === entry.playerId);
  if (playerIndex < 0) return;

  state.game.players[playerIndex].score -= entry.points;
  state.game.activeIndex = playerIndex;
  resetTurnInput();
  renderGame();
}

async function persistFinishedMatch(winner) {
  try {
    await api("matches", {
      method: "POST",
      body: JSON.stringify({
        players: state.game.players,
        history: state.game.history,
        winnerId: winner.id,
      }),
    });
    await loadSession();
    clearNotice();
  } catch (error) {
    showNotice(`Matchen är klar men kunde inte sparas: ${error.message}`, true);
  }
}

async function finishGame(winner) {
  const loser = state.game.players.find((player) => player.id !== winner.id);
  renderGame();
  await persistFinishedMatch(winner);

  if (state.game.mode === "tournament") {
    completeTournamentMatch(winner);
    const next = advanceTournament();

    if (next.type === "complete") {
      state.nextDialogAction = "replayTournament";
      state.nextTournamentMatch = null;
      els.dialogReplayButton.textContent = "Spela slutspel igen";
      els.winnerTitle.textContent = `${next.winner.name} vinner finalen`;
      els.winnerText.textContent = "Slutspelet är klart.";
    } else {
      state.nextDialogAction = "nextTournamentMatch";
      state.nextTournamentMatch = next.match;
      els.dialogReplayButton.textContent = "Nästa match";
      els.winnerTitle.textContent = `${winner.name} går vidare`;
      els.winnerText.textContent = `${winner.score}-${loser.score}. Nästa match: ${next.match.p1.name} mot ${next.match.p2.name}.`;
    }
  } else {
    state.nextDialogAction = "replayMatch";
    state.nextTournamentMatch = null;
    els.dialogReplayButton.textContent = "Spela igen";
    els.winnerTitle.textContent = `${winner.name} vinner`;
    els.winnerText.textContent = loser
      ? `${winner.score}-${loser.score}. ${state.account ? "Statistik sparad." : "Logga in för att spara statistik."}`
      : `${winner.score} poäng.`;
  }

  renderBracket();
  els.winnerDialog.showModal();
}

function stageLabel(playerCount) {
  if (playerCount <= 2) return "Final";
  if (playerCount <= 4) return "Semifinal";
  if (playerCount <= 8) return "Kvartsfinal";
  if (playerCount <= 16) return "Åttondelsfinal";
  return "Omgång";
}

function createTournamentRound(players) {
  const round = {
    label: stageLabel(players.length),
    matches: [],
  };

  for (let index = 0; index < players.length; index += 2) {
    const p1 = players[index];
    const p2 = players[index + 1] || null;
    round.matches.push({
      id: crypto.randomUUID(),
      p1,
      p2,
      status: p2 ? "pending" : "bye",
      winnerId: p2 ? null : p1.id,
      p1Score: null,
      p2Score: null,
    });
  }

  state.tournament.rounds.push(round);
}

function startTournament(players) {
  state.tournament = {
    players,
    rounds: [],
    currentMatchId: null,
  };

  createTournamentRound(players);
  const match = getNextPendingTournamentMatch();
  if (!match) return;
  startTournamentMatch(match);
}

function getNextPendingTournamentMatch() {
  if (!state.tournament) return null;

  for (const round of state.tournament.rounds) {
    const match = round.matches.find((item) => item.status === "pending");
    if (match) return match;
  }

  return null;
}

function getTournamentRoundForMatch(matchId) {
  return state.tournament?.rounds.find((round) => round.matches.some((match) => match.id === matchId));
}

function startTournamentMatch(match) {
  const round = getTournamentRoundForMatch(match.id);
  state.tournament.currentMatchId = match.id;
  startGame([match.p1, match.p2], {
    mode: "tournament",
    context: round?.label || "Slutspel",
    tournamentMatchId: match.id,
  });
}

function completeTournamentMatch(winner) {
  const match = state.tournament.rounds
    .flatMap((round) => round.matches)
    .find((item) => item.id === state.game.tournamentMatchId);

  if (!match) return;

  const p1 = state.game.players[0];
  const p2 = state.game.players[1];
  match.status = "complete";
  match.winnerId = winner.id;
  match.p1Score = p1.score;
  match.p2Score = p2.score;
}

function advanceTournament() {
  const pending = getNextPendingTournamentMatch();
  if (pending) return { type: "next", match: pending };

  const lastRound = state.tournament.rounds.at(-1);
  const winners = lastRound.matches
    .map((match) => [match.p1, match.p2].find((player) => player && player.id === match.winnerId))
    .filter(Boolean);

  if (winners.length === 1) {
    return { type: "complete", winner: winners[0] };
  }

  createTournamentRound(winners);
  return advanceTournament();
}

function renderBracket() {
  if (!state.tournament || state.game?.mode !== "tournament") {
    els.bracketView.hidden = true;
    els.bracketView.replaceChildren();
    return;
  }

  els.bracketView.hidden = false;
  els.bracketView.replaceChildren(
    ...state.tournament.rounds.map((round) => {
      const section = document.createElement("section");
      section.className = "bracket-round";

      const title = document.createElement("h3");
      title.textContent = round.label;
      section.append(title);

      round.matches.forEach((match) => {
        const row = document.createElement("div");
        row.className = `bracket-match${match.id === state.tournament.currentMatchId ? " is-current" : ""}`;

        const left = document.createElement(match.winnerId === match.p1.id ? "strong" : "span");
        left.textContent = match.p1.name;

        const middle = document.createElement("span");
        middle.textContent = match.status === "bye"
          ? "fri"
          : match.status === "complete"
            ? `${match.p1Score}-${match.p2Score}`
            : "mot";

        const rightName = match.p2?.name || "Frirond";
        const right = document.createElement(match.p2 && match.winnerId === match.p2.id ? "strong" : "span");
        right.textContent = rightName;

        row.append(left, middle, right);
        section.append(row);
      });

      return section;
    }),
  );
}

function renderStats() {
  if (!state.account) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Logga in för att se sparad statistik.";
    els.statsList.replaceChildren(empty);
    return;
  }

  if (state.playerStats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Ingen statistik än. Spela klart en match med kontot inloggat.";
    els.statsList.replaceChildren(empty);
    return;
  }

  els.statsList.replaceChildren(
    ...state.playerStats.map((player) => {
      const card = document.createElement("article");
      card.className = "stat-card";

      const title = document.createElement("h3");
      title.textContent = player.name;

      const grid = document.createElement("div");
      grid.className = "stat-grid";

      const stats = [
        ["Matcher", player.stats.games],
        ["Vinster", player.stats.wins],
        ["Förluster", player.stats.losses],
        ["Poäng", player.stats.points],
        ["I hål", player.stats.holes],
        ["På bräda", player.stats.boards],
        ["Miss", player.stats.ground],
      ];

      stats.forEach(([label, value]) => {
        const item = document.createElement("span");
        const strong = document.createElement("strong");
        strong.textContent = value;
        item.append(label, strong);
        grid.append(item);
      });

      card.append(title, grid);
      return card;
    }),
  );
}

function replayCurrentPlayers() {
  if (!state.game) return;

  const players = state.game.players.map((player) => ({
    id: `player-${crypto.randomUUID()}`,
    name: player.name,
    score: 0,
  }));

  state.tournament = null;
  startGame(players);
}

function replayTournament() {
  if (!state.tournament) return;
  const players = state.tournament.players.map((player) => ({
    id: `player-${crypto.randomUUID()}`,
    name: player.name,
    score: 0,
  }));
  startTournament(players);
}

async function submitAuth(action, form) {
  const data = new FormData(form);
  const username = String(data.get("username") || "").trim();
  const password = String(data.get("password") || "");

  try {
    const payload = await api(action, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    state.account = payload.account;
    state.playerStats = (payload.playerStats || []).map(normalizeStats);
    renderAccount();
    renderStats();
    clearNotice();
    if (els.authDialog.open) {
      els.authDialog.close();
    }
    if (action === "register") {
      showView(els.setupView);
    }
    form.reset();
  } catch (error) {
    showNotice(error.message, true);
  }
}

els.setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const names = parsePlayerNames();

  if (names.length < 2) {
    showNotice("Ange minst två spelare, ett namn per rad.", true);
    return;
  }

  if (names.some((name) => name.length > 24)) {
    showNotice("Spelarnamn får vara max 24 tecken.", true);
    return;
  }

  if (names.length > 2 && !state.account) {
    showNotice("Logga in för att spela slutspel med fler än två spelare.", true);
    return;
  }

  clearNotice();
  const players = createPlayers(names);

  if (players.length === 2) {
    state.tournament = null;
    startGame(players);
  } else {
    startTournament(players);
  }
});

document.querySelectorAll("[data-throw]").forEach((button) => {
  button.addEventListener("click", () => recordThrow(button.dataset.throw));
});

els.loginButton.addEventListener("click", () => {
  els.authDialog.showModal();
});

els.createAccountButton.addEventListener("click", () => showView(els.registerView));
els.closeRegisterButton.addEventListener("click", () => showView(els.setupView));

els.logoutButton.addEventListener("click", async () => {
  try {
    await api("logout", { method: "POST", body: "{}" });
    state.account = null;
    state.playerStats = [];
    renderAccount();
    renderStats();
    clearNotice();
  } catch (error) {
    showNotice(error.message, true);
  }
});

els.authDialog.addEventListener("click", (event) => {
  if (event.target === els.authDialog) {
    els.authDialog.close();
  }
});

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth("login", els.loginForm);
});

els.registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth("register", els.registerForm);
});

els.undoThrowButton.addEventListener("click", undoThrow);
els.undoButton.addEventListener("click", undoTurn);
els.newGameButton.addEventListener("click", () => showView(els.setupView));
els.backToSetupButton.addEventListener("click", () => showView(els.setupView));
els.statsButton.addEventListener("click", async () => {
  await loadSession();
  showView(els.statsView);
});
els.closeStatsButton.addEventListener("click", () => showView(els.setupView));

els.dialogSetupButton.addEventListener("click", () => {
  els.winnerDialog.close();
  showView(els.setupView);
});

els.dialogReplayButton.addEventListener("click", () => {
  els.winnerDialog.close();

  if (state.nextDialogAction === "nextTournamentMatch" && state.nextTournamentMatch) {
    startTournamentMatch(state.nextTournamentMatch);
    return;
  }

  if (state.nextDialogAction === "replayTournament") {
    replayTournament();
    return;
  }

  replayCurrentPlayers();
});

loadSession();
