// Gully Captain runs completely in memory.
// Refresh karo aur sab kuch fresh start se chalu hoga.

const sports = [
  {
    id: "cricket",
    emoji: "🏏",
    name: "Cricket",
    copy: "Tape ball ho ya tennis, dono ka scene yahin set.",
    decisions: ["Bat", "Bowl"]
  },
  {
    id: "football",
    emoji: "⚽",
    name: "Football",
    copy: "Turf ho ya gali ka goalpost, sides seedhi niklegi.",
    decisions: ["Kick Off", "Defend"]
  },
  {
    id: "badminton",
    emoji: "🏸",
    name: "Badminton",
    copy: "Doubles ka jugaad aur rotation ka full system.",
    decisions: ["Serve", "Receive"]
  },
  {
    id: "volleyball",
    emoji: "🏐",
    name: "Volleyball",
    copy: "Court chhota ho ya bada, teams fair hi banegi.",
    decisions: ["Serve", "Receive"]
  }
];

const punishments = [
  "Thandi bottle tu layega",
  "Agli baar ball teri taraf se",
  "Stumps tu utha ke layega",
  "Sabko chai pila, bina nautanki",
  "20 pushup, seedha aur chup chap",
  "Samose teri taraf se"
];

const state = {
  sport: "cricket",
  players: [],
  teamCount: 2,
  teams: [],
  captains: [],
  toss: null,
  punishment: "",
  isTossing: false,
  tossToken: 0
};

const elements = {
  notice: document.getElementById("notice"),
  flowTrack: document.getElementById("flowTrack"),
  heroSport: document.getElementById("heroSport"),
  heroPlayers: document.getElementById("heroPlayers"),
  heroFlow: document.getElementById("heroFlow"),
  sportGrid: document.getElementById("sportGrid"),
  playerForm: document.getElementById("playerForm"),
  playerInput: document.getElementById("playerInput"),
  playerChips: document.getElementById("playerChips"),
  playerCount: document.getElementById("playerCount"),
  teamCountOptions: document.getElementById("teamCountOptions"),
  tossBtn: document.getElementById("tossBtn"),
  coin: document.getElementById("coin"),
  coinStatus: document.getElementById("coinStatus"),
  tossSummary: document.getElementById("tossSummary"),
  decisionButtons: document.getElementById("decisionButtons"),
  decisionSummary: document.getElementById("decisionSummary"),
  generateBtn: document.getElementById("generateBtn"),
  teamGateText: document.getElementById("teamGateText"),
  reshuffleBtn: document.getElementById("reshuffleBtn"),
  teamsGrid: document.getElementById("teamsGrid"),
  captainsBtn: document.getElementById("captainsBtn"),
  captainsGrid: document.getElementById("captainsGrid"),
  punishmentBtn: document.getElementById("punishmentBtn"),
  punishmentCard: document.getElementById("punishmentCard"),
  resetBtn: document.getElementById("resetBtn")
};

function renderHeroStats() {
  elements.heroSport.textContent = getActiveSport().name;
  elements.heroPlayers.textContent = formatPlayerCount(state.players.length);
  elements.heroFlow.textContent = getFlowHeadline();
}

function renderFlowTrack() {
  const steps = [
    {
      label: "Sport",
      value: getActiveSport().name,
      status: "done"
    },
    {
      label: "Lineup",
      value: hasEnoughPlayers()
        ? `${formatPlayerCount(state.players.length)} ready`
        : `${formatPlayerCount(state.players.length)} / ${state.teamCount} min`,
      status: hasEnoughPlayers() ? "done" : "live"
    },
    {
      label: "Toss",
      value: state.isTossing
        ? "Sikka ghoom raha"
        : state.toss
          ? `${state.toss.winner} jeeti`
          : "Pending",
      status: state.isTossing ? "live" : state.toss ? "done" : "idle"
    },
    {
      label: "Teams",
      value: state.teams.length ? `${state.teamCount} side set` : "Pending",
      status: state.teams.length ? "done" : state.toss ? "live" : "idle"
    }
  ];

  elements.flowTrack.innerHTML = steps.map((step) => `
    <div class="step-pill ${step.status === "done" ? "is-done" : ""} ${step.status === "live" ? "is-live" : ""}">
      <span class="step-label">${step.label}</span>
      <span class="step-value">${step.value}</span>
    </div>
  `).join("");
}

function renderSportOptions() {
  elements.sportGrid.innerHTML = "";

  sports.forEach((sport) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sport-card${state.sport === sport.id ? " is-active" : ""}`;
    button.setAttribute("aria-pressed", String(state.sport === sport.id));
    button.dataset.sport = sport.id;

    const emoji = document.createElement("span");
    emoji.className = "sport-emoji";
    emoji.textContent = sport.emoji;

    const name = document.createElement("strong");
    name.className = "sport-name";
    name.textContent = sport.name;

    const copy = document.createElement("span");
    copy.className = "sport-copy";
    copy.textContent = sport.copy;

    button.append(emoji, name, copy);
    elements.sportGrid.appendChild(button);
  });
}

function renderTeamCountOptions() {
  elements.teamCountOptions.innerHTML = "";

  [2, 3, 4].forEach((count) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-card${state.teamCount === count ? " is-active" : ""}`;
    button.dataset.teamCount = String(count);
    button.setAttribute("aria-pressed", String(state.teamCount === count));

    const strong = document.createElement("strong");
    strong.textContent = `${count} teams`;

    const span = document.createElement("span");
    span.textContent = count === 2 ? "Seedha face-off" : `${count} side ka scene`;

    button.append(strong, span);
    elements.teamCountOptions.appendChild(button);
  });
}

function renderPlayers() {
  elements.playerChips.innerHTML = "";
  elements.playerCount.textContent = formatPlayerCount(state.players.length);

  if (state.players.length === 0) {
    elements.playerChips.innerHTML = `
      <div class="placeholder-card">
        <h3>Abhi koi banda list me nahi hai</h3>
        <p>Naam daal aur Enter daba. Lineup yahin se banegi.</p>
      </div>
    `;
    return;
  }

  state.players.forEach((player) => {
    const chip = document.createElement("div");
    chip.className = "chip";

    const name = document.createElement("span");
    name.textContent = player.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", `Remove ${player.name}`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => removePlayer(player.id));

    chip.append(name, removeBtn);
    elements.playerChips.appendChild(chip);
  });
}

function renderToss() {
  const enoughPlayers = hasEnoughPlayers();
  const activeSport = getActiveSport();

  elements.tossBtn.textContent = state.toss ? "🎲 Dobara Toss" : "🎲 Toss ghuma";
  elements.tossBtn.disabled = !enoughPlayers || state.isTossing;
  elements.coin.classList.toggle("is-spinning", state.isTossing);

  if (state.isTossing) {
    elements.coin.textContent = "🎲";
    elements.coinStatus.textContent = "Sikka full hawa me hai";
    elements.tossSummary.innerHTML = `
      <div class="toss-result">
        <h3>Toss chal raha hai</h3>
        <p>Abhi kismat bakchodi kar rahi hai. 2 second de.</p>
      </div>
    `;
  } else if (!enoughPlayers) {
    elements.coin.textContent = "?";
    elements.coinStatus.textContent = "Pehle lineup jama kar";
    elements.tossSummary.innerHTML = `
      <div class="placeholder-card">
        <h3>Toss lock hai</h3>
        <p>${state.teamCount} teams ke liye kam se kam ${state.teamCount} bande chahiye.</p>
      </div>
    `;
  } else if (!state.toss) {
    elements.coin.textContent = "?";
    elements.coinStatus.textContent = "Sikka abhi pocket me hai";
    elements.tossSummary.innerHTML = `
      <div class="placeholder-card">
        <h3>Toss abhi pending hai</h3>
        <p>Scene ready hai. Ab sikka uchaal aur dekh kaunsi team pehle haq jamati hai.</p>
      </div>
    `;
  } else {
    elements.coin.textContent = state.toss.coin === "HEADS" ? "H" : "T";
    elements.coinStatus.textContent = `${state.toss.coin} aaya`;
    elements.tossSummary.innerHTML = `
      <div class="toss-result">
        <h3>${state.toss.winner} ne toss maara</h3>
        <p>${state.toss.coin} nikla. Ab bolo pehla move kya hoga.</p>
      </div>
    `;
  }

  elements.decisionButtons.innerHTML = "";

  if (state.toss) {
    activeSport.decisions.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `decision-btn${state.toss.decision === option ? " is-active" : ""}`;
      button.textContent = option;
      button.addEventListener("click", () => chooseDecision(option));
      elements.decisionButtons.appendChild(button);
    });
  }

  elements.decisionSummary.textContent = state.toss?.decision
    ? `${state.toss.winner} ne ${state.toss.decision} pakda. Ab teams baant de.`
    : "";
}

function renderTeams() {
  elements.teamsGrid.innerHTML = "";
  elements.teamGateText.textContent = getTeamGateCopy();

  if (state.teams.length === 0) {
    elements.teamsGrid.innerHTML = `
      <div class="placeholder-card">
        <h3>Teams abhi nikli nahi</h3>
        <p>${state.toss ? "Toss ho gaya. Ab button dabao aur random side nikaalo." : "Pehle toss nipta, phir teams niklegi."}</p>
      </div>
    `;
    return;
  }

  state.teams.forEach((team, index) => {
    const card = document.createElement("article");
    card.className = "team-card";
    card.style.setProperty("--delay", `${index * 70}ms`);

    const meta = document.createElement("div");
    meta.className = "team-meta";

    const nameWrap = document.createElement("div");
    nameWrap.className = "team-name-wrap";

    const title = document.createElement("h3");
    title.textContent = team.name;

    const badges = document.createElement("div");
    badges.className = "team-badges";

    if (state.toss?.winner === team.name) {
      const tossTag = document.createElement("span");
      tossTag.className = "team-tag";
      tossTag.textContent = "Toss winner";
      badges.appendChild(tossTag);
    }

    if (state.toss?.winner === team.name && state.toss.decision) {
      const decisionTag = document.createElement("span");
      decisionTag.className = "team-tag";
      decisionTag.textContent = state.toss.decision;
      badges.appendChild(decisionTag);
    }

    nameWrap.append(title, badges);

    const size = document.createElement("span");
    size.className = "team-size";
    size.textContent = formatPlayerCount(team.players.length);

    meta.append(nameWrap, size);

    const list = document.createElement("ul");
    list.className = "team-list";

    team.players.forEach((playerName) => {
      const item = document.createElement("li");
      item.textContent = playerName;
      list.appendChild(item);
    });

    card.append(meta, list);
    elements.teamsGrid.appendChild(card);
  });
}

function renderCaptains() {
  elements.captainsGrid.innerHTML = "";

  if (state.captains.length === 0) {
    elements.captainsGrid.innerHTML = `
      <div class="placeholder-card">
        <h3>Captain abhi decide nahi hua</h3>
        <p>${state.teams.length ? "Teams aa gayi. Ab ek click me captains nikaal." : "Pehle teams banao, phir hero niklega."}</p>
      </div>
    `;
    return;
  }

  state.captains.forEach((captain, index) => {
    const card = document.createElement("article");
    card.className = "captain-card";
    card.style.setProperty("--delay", `${index * 70}ms`);

    const title = document.createElement("h3");
    title.textContent = `${captain.team} ka captain`;

    const name = document.createElement("p");
    name.textContent = captain.player;

    card.append(title, name);
    elements.captainsGrid.appendChild(card);
  });
}

function renderPunishment() {
  if (!state.punishment) {
    elements.punishmentCard.innerHTML = `
      <div class="placeholder-card">
        <h3>Abhi saza hold pe hai</h3>
        <p>${state.teams.length ? "Mood aaye to click maar aur harne wale ko kaam de." : "Match ka setup ho jaaye, phir saza nikaalna."}</p>
      </div>
    `;
    return;
  }

  elements.punishmentCard.innerHTML = `
    <div class="punishment-result">
      <h3>Aaj ka halka tamasha</h3>
      <p>${state.punishment}</p>
    </div>
  `;
}

function renderButtons() {
  const enoughPlayers = hasEnoughPlayers();
  const hasToss = Boolean(state.toss);
  const hasTeams = state.teams.length > 0;

  elements.generateBtn.disabled = !enoughPlayers || !hasToss || state.isTossing;
  elements.reshuffleBtn.disabled = !hasTeams || state.isTossing;
  elements.captainsBtn.disabled = !hasTeams || state.isTossing;
  elements.punishmentBtn.disabled = !hasTeams || state.isTossing;
}

function renderAll() {
  renderHeroStats();
  renderFlowTrack();
  renderSportOptions();
  renderPlayers();
  renderTeamCountOptions();
  renderToss();
  renderTeams();
  renderCaptains();
  renderPunishment();
  renderButtons();
}

function addPlayer(name) {
  const cleanedName = name.trim();

  if (!cleanedName) {
    showNotice("Naam daal bina button kyun thok raha hai?", "error");
    return;
  }

  state.players.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: cleanedName
  });

  clearProgressForLineupChange();
  renderAll();
  elements.playerInput.value = "";
  elements.playerInput.focus();
}

function removePlayer(playerId) {
  state.players = state.players.filter((player) => player.id !== playerId);
  clearProgressForLineupChange();
  renderAll();
}

function setSport(sportId) {
  if (state.sport === sportId) {
    return;
  }

  state.sport = sportId;

  if (state.toss?.decision) {
    state.toss.decision = "";
  }

  showNotice(`${getActiveSport().name} ka mode on. Ab scene ussi hisaab se chalega.`, "info");
  renderAll();
}

function setTeamCount(count) {
  if (state.teamCount === count) {
    return;
  }

  state.teamCount = count;
  clearProgress({
    keepToss: false,
    message: `Ab ${count} side hongi. Toss phir se hoga, koi shortcut nahi.`
  });
  renderAll();
}

function startToss() {
  if (!hasEnoughPlayers() || state.isTossing) {
    return;
  }

  const tossToken = Date.now();

  state.isTossing = true;
  state.tossToken = tossToken;
  state.toss = null;
  renderButtons();
  renderToss();
  renderFlowTrack();
  renderHeroStats();

  window.setTimeout(() => {
    if (state.tossToken !== tossToken) {
      return;
    }

    state.isTossing = false;
    state.toss = {
      coin: Math.random() < 0.5 ? "HEADS" : "TAILS",
      winner: randomItem(getTeamLabels()),
      decision: ""
    };

    showNotice(`${state.toss.winner} ne toss jeeta. Ab pehla move decide kar.`, "success");
    renderAll();
  }, 2000);
}

function chooseDecision(option) {
  if (!state.toss) {
    return;
  }

  state.toss.decision = option;
  renderToss();
  renderTeams();
  renderFlowTrack();
  renderHeroStats();
}

function generateTeams() {
  if (!hasEnoughPlayers()) {
    showNotice(`Kam se kam ${state.teamCount} bande chahiye. Tabhi ${state.teamCount} teams niklegi.`, "error");
    return;
  }

  if (!state.toss) {
    showNotice("Pehle toss kara bhai, phir teams baantenge.", "error");
    return;
  }

  const hadTeams = state.teams.length > 0;
  const shuffledPlayers = shuffle(state.players.map((player) => player.name));
  const nextTeams = [];
  const baseSize = Math.floor(shuffledPlayers.length / state.teamCount);
  const remainder = shuffledPlayers.length % state.teamCount;

  let startIndex = 0;

  getTeamLabels().forEach((teamName, index) => {
    const size = baseSize + (index < remainder ? 1 : 0);
    nextTeams.push({
      name: teamName,
      players: shuffledPlayers.slice(startIndex, startIndex + size)
    });
    startIndex += size;
  });

  state.teams = nextTeams;
  state.captains = [];
  state.punishment = "";

  showNotice(
    hadTeams
      ? "Teams dobara hila di. Ab setting ka rona mat ro."
      : "Teams set. Ab seedha khelo, faltu ka debate bandh.",
    "success"
  );
  renderAll();
}

function pickCaptains() {
  if (state.teams.length === 0) {
    showNotice("Pehle teams bana, warna captain hawa me se thodi niklega.", "error");
    return;
  }

  state.captains = state.teams.map((team) => ({
    team: team.name,
    player: randomItem(team.players)
  }));

  showNotice("Captains nikal gaye. Ab kaun hero hai clear hai.", "success");
  renderCaptains();
}

function pickPunishment() {
  if (state.teams.length === 0) {
    showNotice("Pehle match ka scene to set hone de, phir saza nikaalenge.", "error");
    return;
  }

  state.punishment = randomItem(punishments);
  showNotice("Saza nikal gayi. Ab hasi mazaak me nipta lena.", "info");
  renderPunishment();
}

function resetMatch() {
  state.sport = "cricket";
  state.players = [];
  state.teamCount = 2;
  state.teams = [];
  state.captains = [];
  state.toss = null;
  state.punishment = "";
  state.isTossing = false;
  state.tossToken = 0;

  hideNotice();
  renderAll();
  elements.playerInput.focus();
}

function clearProgressForLineupChange() {
  const keepToss = Boolean(state.toss) && !state.isTossing;

  clearProgress({
    keepToss,
    message: keepToss
      ? "Lineup badla hai. Teams fir se banegi, toss same rahega."
      : "Lineup badla hai. Toss aur teams fresh chalenge."
  });
}

function clearProgress({ keepToss, message }) {
  if (!state.teams.length && !state.captains.length && !state.punishment && !state.toss && !state.isTossing) {
    return;
  }

  state.teams = [];
  state.captains = [];
  state.punishment = "";
  state.isTossing = false;
  state.tossToken = 0;

  if (!keepToss) {
    state.toss = null;
  }

  if (message) {
    showNotice(message, "info");
  }
}

function showNotice(message, tone) {
  elements.notice.textContent = message;
  elements.notice.dataset.tone = tone;
  elements.notice.classList.remove("is-hidden");
}

function hideNotice() {
  elements.notice.textContent = "";
  elements.notice.classList.add("is-hidden");
  delete elements.notice.dataset.tone;
}

function getActiveSport() {
  return sports.find((sport) => sport.id === state.sport) || sports[0];
}

function getTeamLabels() {
  return Array.from({ length: state.teamCount }, (_, index) => `Team ${String.fromCharCode(65 + index)}`);
}

function hasEnoughPlayers() {
  return state.players.length >= state.teamCount;
}

function formatPlayerCount(count) {
  return `${count} ${count === 1 ? "banda" : "bande"}`;
}

function getFlowHeadline() {
  if (state.isTossing) {
    return "Sikka ghoom raha";
  }

  if (state.teams.length) {
    return "Match set hai";
  }

  if (state.toss) {
    return "Toss ho gaya";
  }

  if (hasEnoughPlayers()) {
    return "Toss pending";
  }

  return "Lineup pending";
}

function getTeamGateCopy() {
  if (!hasEnoughPlayers()) {
    return `Pehle kam se kam ${state.teamCount} bande jama kar. Fir toss aur teams dono smooth chalenge.`;
  }

  if (!state.toss) {
    return "Pehle toss kara. Yahin se gully ka asli order shuru hota hai.";
  }

  return "Toss ho gaya. Ab random team niklegi, koi setting ka chance nahi.";
}

function shuffle(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

elements.playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addPlayer(elements.playerInput.value);
});

// Enter se add karna gully speed ke liye rakha hai.
elements.playerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addPlayer(elements.playerInput.value);
  }
});

elements.sportGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sport]");
  if (button) {
    setSport(button.dataset.sport);
  }
});

elements.teamCountOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-team-count]");
  if (button) {
    setTeamCount(Number(button.dataset.teamCount));
  }
});

elements.tossBtn.addEventListener("click", startToss);
elements.generateBtn.addEventListener("click", generateTeams);
elements.reshuffleBtn.addEventListener("click", generateTeams);
elements.captainsBtn.addEventListener("click", pickCaptains);
elements.punishmentBtn.addEventListener("click", pickPunishment);
elements.resetBtn.addEventListener("click", resetMatch);

renderAll();
