/**
 * 画面操作：フォーム入力から結果表示まで
 */
(function () {
  const form = document.getElementById("kigaku-form");
  const birthInput = document.getElementById("birth");
  const targetInput = document.getElementById("target");
  const errorEl = document.getElementById("form-error");
  const resultEl = document.getElementById("result");

  /** CSSクラス用の方位キー */
  const DIR_CLASS = {
    南: "s",
    北: "n",
    東: "e",
    西: "w",
    南東: "se",
    南西: "sw",
    北東: "ne",
    北西: "nw",
  };

  /** 今日の日付を YYYY-MM-DD で返す */
  function todayValue() {
    const n = new Date();
    const m = String(n.getMonth() + 1).padStart(2, "0");
    const d = String(n.getDate()).padStart(2, "0");
    return `${n.getFullYear()}-${m}-${d}`;
  }

  targetInput.value = todayValue();

  /** エラー表示 */
  function showError(message) {
    errorEl.hidden = !message;
    errorEl.textContent = message || "";
  }

  /** 吉方位ナビのボタン種別 */
  const SPOT_KINDS = [
    ["shrine", "神社"],
    ["cafe", "カフェ"],
    ["park", "公園"],
  ];

  /** 吉方リストを描画 */
  function renderLucky(items) {
    const ul = document.getElementById("lucky-list");
    ul.innerHTML = "";
    if (!items.length) {
      ul.innerHTML = '<li class="empty">該当する吉方の目安はありませんでした。</li>';
      return;
    }
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="dir-name">${item.direction}</span>` +
        `<span class="dir-tag">${item.reason}</span>`;

      const spotRow = document.createElement("div");
      spotRow.className = "spot-buttons";
      spotRow.innerHTML = SPOT_KINDS.map(
        ([kind, label]) =>
          `<button type="button" class="spot-btn" data-direction="${item.direction}" data-kind="${kind}">${label}を探す</button>`
      ).join("");
      li.appendChild(spotRow);

      ul.appendChild(li);
    }
  }

  /** 吉方位ナビ：ボタン押下で現在地からその方角のスポットを地図で開く */
  document.getElementById("lucky-list").addEventListener("click", function (event) {
    const btn = event.target.closest(".spot-btn");
    if (!btn) return;

    const direction = btn.dataset.direction;
    const kind = btn.dataset.kind;
    const originalLabel = btn.textContent;

    btn.disabled = true;
    btn.textContent = "現在地を取得中…";

    window.KigakuSpot.findSpot(direction, kind, function (message) {
      alert(message);
    });

    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }, 3000);
  });

  /** 凶方リストを描画 */
  function renderUnlucky(items) {
    const ul = document.getElementById("unlucky-list");
    ul.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="dir-name">${item.direction}` +
        `<span class="dir-tag">（${item.name}）</span></span>` +
        `<p class="dir-short">${item.short}</p>`;
      ul.appendChild(li);
    }
  }

  /** 注意書きを描画 */
  function renderNotes(notes) {
    const ul = document.getElementById("notes");
    ul.innerHTML = "";
    for (const note of notes) {
      const li = document.createElement("li");
      li.textContent = note;
      ul.appendChild(li);
    }
  }

  /** 八角形の方位マスを1つ作る */
  function createDirCell(cell) {
    const div = document.createElement("div");
    const hasBad = cell.tags.some((t) => t.type === "bad");
    const hasGood = cell.tags.some((t) => t.type === "good");
    div.className =
      "oct-cell" +
      (hasBad ? " has-bad" : "") +
      (hasGood && !hasBad ? " has-good" : "");

    const tagsHtml = cell.tags
      .map(
        (t) =>
          `<span class="oct-tag oct-tag-${t.type}">${t.label}</span>`
      )
      .join("");

    div.innerHTML =
      `<span class="oct-dir">${cell.dir}</span>` +
      `<span class="oct-star">${cell.short}</span>` +
      `<span class="oct-tags">${tagsHtml}</span>`;
    return div;
  }

  /** 八角形盤を描画 */
  function renderOctagon(boardId, titleId, rangeId, board) {
    document.getElementById(titleId).textContent = board.period.label;
    document.getElementById(rangeId).textContent = board.period.range;

    const root = document.getElementById(boardId);
    root.innerHTML = "";
    root.className = "octagon";

    const ring = document.createElement("div");
    ring.className = "octagon-ring";

    for (const dir of window.Kigaku.DIR_ORDER) {
      const cell = board.cells[dir];
      const el = createDirCell(cell);
      el.classList.add(`oct-${DIR_CLASS[dir]}`);
      ring.appendChild(el);
    }

    const center = document.createElement("div");
    center.className = "oct-center";
    center.innerHTML =
      `<span class="oct-dir">中宮</span>` +
      `<span class="oct-star">${board.centerShort}</span>` +
      `<span class="oct-center-name">${board.centerName}</span>`;
    ring.appendChild(center);

    root.appendChild(ring);
  }

  /** 開運アイテム（Amazonアソシエイト）を反映 */
  function renderAmazon(element) {
    const block = document.getElementById("amazon-block");
    const amazon = window.KigakuAmazon;
    const item = amazon && amazon.isEnabled() ? amazon.itemFor(element) : null;

    if (!item) {
      block.hidden = true;
      return;
    }

    document.getElementById("amazon-item-label").textContent =
      `${item.color}のパワーストーン`;
    document.getElementById("amazon-link").href = amazon.searchUrl(item.keyword);
    block.hidden = false;
  }

  /** 結果を画面に反映 */
  function renderResult(data) {
    document.getElementById("honmei-name").textContent = data.honmei.name;
    document.getElementById("honmei-desc").textContent = data.honmei.short;
    document.getElementById("getsumei-name").textContent = data.getsumei.name;
    renderAmazon(data.honmei.element);

    document.getElementById("day-star").textContent =
      `日家九星：${data.target.dayStar.name}`;
    document.getElementById("day-desc").textContent = data.target.dayStar.short;

    renderOctagon(
      "year-board",
      "year-board-title",
      "year-board-range",
      data.yearBoard
    );
    renderOctagon(
      "month-board",
      "month-board-title",
      "month-board-range",
      data.monthBoard
    );
    renderOctagon(
      "day-board",
      "day-board-title",
      "day-board-range",
      data.dayBoard
    );
    renderLucky(data.lucky);
    renderUnlucky(data.unlucky);
    renderNotes(data.notes);

    resultEl.hidden = false;
    resultEl.classList.remove("reveal-replay");
    void resultEl.offsetWidth;
    resultEl.classList.add("reveal-replay");
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("");

    if (!birthInput.value || !targetInput.value) {
      showError("生年月日と知りたい日付の両方を入力してください。");
      resultEl.hidden = true;
      return;
    }

    const birth = new Date(birthInput.value + "T12:00:00");
    const target = new Date(targetInput.value + "T12:00:00");

    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) {
      showError("日付の形式を確認してください。");
      resultEl.hidden = true;
      return;
    }

    if (birth > new Date()) {
      showError("生年月日は今日以前の日付を指定してください。");
      resultEl.hidden = true;
      return;
    }

    const data = window.Kigaku.calculateKigaku(birth, target);
    renderResult(data);
  });
})();
