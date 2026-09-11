/**
 * 九星気学の計算ロジック
 * 本命星・日家九星・吉方／凶方を求める
 */

/** 九星の基本情報 */
const STARS = {
  1: {
    name: "一白水星",
    element: "水",
    short: "柔軟で知性的。周囲の調和を大切にするタイプです。",
  },
  2: {
    name: "二黒土星",
    element: "土",
    short: "母性的で忍耐強い。着実に物事を育てるタイプです。",
  },
  3: {
    name: "三碧木星",
    element: "木",
    short: "行動力があり前向き。新しいことに挑戦するタイプです。",
  },
  4: {
    name: "四緑木星",
    element: "木",
    short: "穏やかで社交的。人とのつながりを広げるタイプです。",
  },
  5: {
    name: "五黄土星",
    element: "土",
    short: "中心的でリーダーシップがある。物事の軸になるタイプです。",
  },
  6: {
    name: "六白金星",
    element: "金",
    short: "誠実で責任感が強い。信頼を積み重ねるタイプです。",
  },
  7: {
    name: "七赤金星",
    element: "金",
    short: "明るく華やか。感性とコミュニケーションが得意なタイプです。",
  },
  8: {
    name: "八白土星",
    element: "土",
    short: "変革と発展を好む。積み上げた力で道を拓くタイプです。",
  },
  9: {
    name: "九紫火星",
    element: "火",
    short: "情熱的で直感が鋭い。華やかな魅力を持つタイプです。",
  },
};

/** 洛書の数字 → 方位（中央は null） */
const STAR_TO_DIR = {
  1: "北",
  2: "南西",
  3: "東",
  4: "南東",
  5: null,
  6: "北西",
  7: "西",
  8: "北東",
  9: "南",
};

/** 略称（盤の中央・方位に表示） */
const STAR_SHORT = {
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
};

/** 八方位の並び（南が上の描画順） */
const DIR_ORDER = ["南東", "南", "南西", "東", "西", "北東", "北", "北西"];

/** 反対方位 */
const OPPOSITE = {
  北: "南",
  南: "北",
  東: "西",
  西: "東",
  北東: "南西",
  南西: "北東",
  南東: "北西",
  北西: "南東",
};

/** 十二支 → 八方位 */
const BRANCH_TO_DIR = [
  "北", // 子
  "北東", // 丑
  "北東", // 寅
  "東", // 卯
  "南東", // 辰
  "南東", // 巳
  "南", // 午
  "南西", // 未
  "南西", // 申
  "西", // 酉
  "北西", // 戌
  "北西", // 亥
];

/** 節入りの目安日（月番号 1〜12） */
const SOLAR_TERM_DAY = {
  1: 6, // 小寒
  2: 4, // 立春
  3: 6, // 啓蟄
  4: 5, // 清明
  5: 6, // 立夏
  6: 6, // 芒種
  7: 7, // 小暑
  8: 8, // 立秋
  9: 8, // 白露
  10: 8, // 寒露
  11: 7, // 立冬
  12: 7, // 大雪
};

/** 節月の開始月日（表示用） */
const SOLAR_TERM_START = [
  null,
  { m: 2, d: 4, label: "立春" },
  { m: 3, d: 6, label: "啓蟄" },
  { m: 4, d: 5, label: "清明" },
  { m: 5, d: 6, label: "立夏" },
  { m: 6, d: 6, label: "芒種" },
  { m: 7, d: 7, label: "小暑" },
  { m: 8, d: 8, label: "立秋" },
  { m: 9, d: 8, label: "白露" },
  { m: 10, d: 8, label: "寒露" },
  { m: 11, d: 7, label: "立冬" },
  { m: 12, d: 7, label: "大雪" },
  { m: 1, d: 6, label: "小寒" },
];

/** 1〜9 に収める */
function wrap9(n) {
  return ((((n - 1) % 9) + 9) % 9) + 1;
}

/** 日付を年月日オブジェクトに */
function toParts(date) {
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  };
}

/** ローカル日付を UTC 日付として比較しやすい Date にする */
function dateOnly(y, m, d) {
  return new Date(y, m - 1, d);
}

/** 日数差（a → b） */
function diffDays(a, b) {
  const ms = dateOnly(b.getFullYear(), b.getMonth() + 1, b.getDate()) -
    dateOnly(a.getFullYear(), a.getMonth() + 1, a.getDate());
  return Math.round(ms / 86400000);
}

/**
 * 立春を考慮した「星の年」を返す
 * 立春前日までは前年扱い
 */
function getStarYear(date) {
  const { y, m, d } = toParts(date);
  const risshun = SOLAR_TERM_DAY[2];
  if (m < 2 || (m === 2 && d < risshun)) {
    return y - 1;
  }
  return y;
}

/**
 * 年家九星（本命星の計算にも使う）
 * 式: wrap9(11 - (年 % 9 || 9))
 */
function getYearStar(starYear) {
  const r = starYear % 9;
  return wrap9(11 - (r === 0 ? 9 : r));
}

/**
 * 節月番号（立春=1 … 小寒=12）
 */
function getSolarMonthIndex(date) {
  const { y, m, d } = toParts(date);
  const starYear = getStarYear(date);

  // 立春前は前年の節月 12（小寒以降）
  if (starYear < y || (m === 1) || (m === 2 && d < SOLAR_TERM_DAY[2])) {
    if (m === 1 && d < SOLAR_TERM_DAY[1]) {
      // 小寒前 → さらに前の年の大雪月扱いだが、星の年はすでに前年
      // 大雪(12)〜小寒前
      return 12;
    }
    if (m === 1 || (m === 2 && d < SOLAR_TERM_DAY[2])) {
      return 12; // 小寒〜立春前
    }
  }

  // 立春以降: その月の節入り前なら前の節月
  const termDay = SOLAR_TERM_DAY[m];
  if (d < termDay) {
    // 前月の節月。1月は来ない想定（立春後の2月以降）
    if (m === 2) return 1; // ありえないが安全策
    // 3月節入り前 → 立春月(1)、… マップ:
    // 月 m の節入り前 = 節月 (m - 2) ただし立春=1 なので
    // 2月立春後=1, 3月啓蟄後=2, ...
    // 節入り前はひとつ前: 3月啓蟄前 = 1（立春月）
    return m - 2;
  }
  // 節入り当日以降
  // 2月→1, 3月→2, ... 12月→11, 1月小寒後は上で処理
  if (m === 1) return 12;
  return m - 1;
}

/**
 * 月家九星
 */
function getMonthStar(date) {
  const yearStar = getYearStar(getStarYear(date));
  const k = getSolarMonthIndex(date);
  let start;
  if ([1, 4, 7].includes(yearStar)) start = 8;
  else if ([2, 5, 8].includes(yearStar)) start = 2;
  else start = 5;
  return wrap9(start - (k - 1));
}

/**
 * 日の干支番号（甲子=0 … 癸亥=59）
 * 基準: 1900-01-01 = 甲戌 = 10
 */
function getKanshiIndex(date) {
  const base = Date.UTC(1900, 0, 1);
  const t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((t - base) / 86400000);
  return ((10 + days) % 60 + 60) % 60;
}

/** 冬至・夏至の目安日（日本の暦に近い固定日） */
function approxSolstice(year, season) {
  if (season === "summer") {
    // 夏至は 21〜22 日。4年周期の粗い近似
    const day = year % 4 === 0 ? 21 : 21;
    // 2007 は 22 日だった年があるため、簡易補正
    const special = { 2007: 22 };
    return dateOnly(year, 6, special[year] || day);
  }
  const special = { 2008: 21 };
  return dateOnly(year, 12, special[year] || 22);
}

/**
 * 至点に最も近い甲子日（仮の変遁日）
 * 干支 0〜28 → 直前の甲子、29〜59 → 直後の甲子
 */
function nearestKoshi(solstice) {
  const k = getKanshiIndex(solstice);
  const d = dateOnly(
    solstice.getFullYear(),
    solstice.getMonth() + 1,
    solstice.getDate()
  );
  if (k <= 28) {
    d.setDate(d.getDate() - k);
  } else {
    d.setDate(d.getDate() + (60 - k));
  }
  return d;
}

/**
 * 夏至・冬至の仮切替日を時系列で並べる
 * yang=true は冬至系（陽遁・一白始まり）
 */
function rawSwitchPoints(aroundYear) {
  const points = [];
  for (let y = aroundYear - 2; y <= aroundYear + 2; y++) {
    points.push({
      at: nearestKoshi(approxSolstice(y, "summer")),
      yang: false,
      season: "summer",
    });
    points.push({
      at: nearestKoshi(approxSolstice(y, "winter")),
      yang: true,
      season: "winter",
    });
  }
  points.sort((a, b) => a.at - b.at);
  return points;
}

/**
 * 九星の閏を反映した切替リストを作る
 * 間隔240日 → 次の切替を60日前倒しし、甲午から七赤（冬）／三碧（夏）で開始
 */
function buildSwitchList(aroundYear) {
  const raw = rawSwitchPoints(aroundYear);
  const list = [];
  const skip = new Set();

  for (let i = 0; i < raw.length - 1; i++) {
    if (skip.has(i)) continue;

    const cur = raw[i];
    const next = raw[i + 1];
    const gap = diffDays(cur.at, next.at);

    list.push({
      at: cur.at,
      yang: cur.yang,
      startStar: cur.yang ? 1 : 9,
    });

    if (gap === 240) {
      // 閏60日の31日目＝甲午（甲子の30日前）を新切替日にする
      const leapAt = dateOnly(
        next.at.getFullYear(),
        next.at.getMonth() + 1,
        next.at.getDate()
      );
      leapAt.setDate(leapAt.getDate() - 30);
      list.push({
        at: leapAt,
        yang: next.yang,
        startStar: next.yang ? 7 : 3,
      });
      skip.add(i + 1); // 元の次切替（甲子）は使わない
    }
  }

  list.sort((a, b) => a.at - b.at);
  return list;
}

/**
 * 日家九星（陰陽遁 + 九星の閏）
 */
function getDayStar(date) {
  const switches = buildSwitchList(date.getFullYear());
  let current = switches[0];
  for (const s of switches) {
    if (diffDays(s.at, date) >= 0) current = s;
  }
  const days = diffDays(current.at, date);
  if (current.yang) {
    return wrap9(current.startStar + days);
  }
  return wrap9(current.startStar - days);
}

/**
 * 中宮の星から九星盤を作る
 * 戻り値: { 北: 星番号, ... }（中央は含めない）
 */
function buildChart(centerStar) {
  const chart = {};
  for (let b = 1; b <= 9; b++) {
    if (b === 5) continue;
    const star = wrap9(centerStar + (b - 5));
    const dir = STAR_TO_DIR[b];
    chart[dir] = star;
  }
  return chart;
}

/**

 * 表示用の九星盤（南が上）

 * 各マス: { star, name, short, dir, isCenter }

 */

function buildBoardGrid(centerStar) {

  const layout = [

    [4, 9, 2],

    [3, 5, 7],

    [8, 1, 6],

  ];

  return layout.map((row) =>

    row.map((b) => {

      const star = wrap9(centerStar + (b - 5));

      return {

        star,

        name: STARS[star].name,

        short: STAR_SHORT[star],

        dir: b === 5 ? "中宮" : STAR_TO_DIR[b],

        isCenter: b === 5,

      };

    })

  );

}



/** 盤上で指定した星がある方位（中央なら null） */

function findStarDirection(chart, centerStar, targetStar) {

  if (targetStar === centerStar) return null;

  for (const [dir, star] of Object.entries(chart)) {

    if (star === targetStar) return dir;

  }

  return null;

}



/**

 * 本命星と相生・比和の星番号リスト（吉方の目安）

 */

function getSupportStars(honmei) {

  const elementOf = (n) => STARS[n].element;

  const me = elementOf(honmei);

  const generates = { 水: "木", 木: "火", 火: "土", 土: "金", 金: "水" };

  const generatedBy = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };

  const goodElements = [me, generates[me], generatedBy[me]];

  return [1, 2, 3, 4, 6, 7, 8, 9].filter((n) =>

    goodElements.includes(elementOf(n))

  );

}



/** 星の年の十二支番号（子=0） */

function getYearBranchIndex(starYear) {

  return ((starYear - 4) % 12 + 12) % 12;

}



/** 節月の十二支番号（立春月=寅） */

function getMonthBranchIndex(solarMonthIndex) {

  return (solarMonthIndex + 1) % 12;

}



/** 日付の十二支番号 */

function getDayBranchIndex(date) {

  return getKanshiIndex(date) % 12;

}



/** 十二支の破（反対方位） */

function getHaDirection(branchIndex) {

  return OPPOSITE[BRANCH_TO_DIR[branchIndex]];

}



/** YYYY/M/D 形式 */

function formatDateSlash(y, m, d) {

  return `${y}/${m}/${d}`;

}



/** 1日前 */

function dayBefore(y, m, d) {

  const dt = dateOnly(y, m, d);

  dt.setDate(dt.getDate() - 1);

  return {

    y: dt.getFullYear(),

    m: dt.getMonth() + 1,

    d: dt.getDate(),

  };

}



/** 年盤の期間（立春〜翌立春前日） */

function getYearPeriod(starYear) {

  const start = SOLAR_TERM_START[1];

  const end = dayBefore(starYear + 1, start.m, start.d);

  return {

    label: `${starYear}年`,

    range: `(${formatDateSlash(starYear, start.m, start.d)}～${formatDateSlash(end.y, end.m, end.d)})`,

  };

}



/** 月盤の期間（節入り〜次節入り前日） */

function getMonthPeriod(date) {

  const k = getSolarMonthIndex(date);

  const starYear = getStarYear(date);

  const startInfo = SOLAR_TERM_START[k];

  let startY = starYear;

  if (k === 12) startY = starYear + 1;

  const nextK = k === 12 ? 1 : k + 1;

  const nextInfo = SOLAR_TERM_START[nextK];

  let nextY = starYear;

  if (nextK === 1 || k === 12) nextY = starYear + 1;

  const end = dayBefore(nextY, nextInfo.m, nextInfo.d);

  const monthLabel = k === 12 ? "1月" : `${startInfo.m}月`;

  return {

    label: monthLabel,

    range: `(${formatDateSlash(startY, startInfo.m, startInfo.d)}～${formatDateSlash(end.y, end.m, end.d)})`,

  };

}



/** 日盤の期間表示 */

function getDayPeriod(date) {

  const { y, m, d } = toParts(date);

  return {

    label: formatDateSlash(y, m, d),

    range: "",

  };

}



/**

 * 八方位盤用データ（殺・破・吉方ラベル付き）

 */

function buildAnnotatedBoard(centerStar, options) {

  const { honmei, getsumei, haDirection, kind, period } = options;

  const chart = buildChart(centerStar);

  const grid = buildBoardGrid(centerStar);

  const tagsByDir = {};

  for (const dir of DIR_ORDER) tagsByDir[dir] = [];



  const pushTag = (dir, tag, type) => {

    if (!dir || !tagsByDir[dir]) return;

    if (tagsByDir[dir].some((t) => t.label === tag)) return;

    tagsByDir[dir].push({ label: tag, type });

  };



  const goou = findStarDirection(chart, centerStar, 5);

  const anken = goou ? OPPOSITE[goou] : null;

  pushTag(goou, "五黄殺", "bad");

  pushTag(anken, "暗剣殺", "bad");



  if (haDirection) {

    const haName = kind === "year" ? "歳破" : kind === "month" ? "月破" : "日破";

    pushTag(haDirection, haName, "bad");

  }



  const honmeiDir = findStarDirection(chart, centerStar, honmei);

  const honmeiTeki = honmeiDir ? OPPOSITE[honmeiDir] : null;

  pushTag(honmeiDir, "本命殺", "bad");

  pushTag(honmeiTeki, "本命的殺", "bad");



  const getsuDir = findStarDirection(chart, centerStar, getsumei);

  const getsuTeki = getsuDir ? OPPOSITE[getsuDir] : null;

  pushTag(getsuDir, "月命殺", "bad");

  pushTag(getsuTeki, "月命的殺", "bad");



  const teii = STAR_TO_DIR[honmei];

  if (teii) pushTag(OPPOSITE[teii], "定位対冲", "bad");



  const badDirs = new Set(

    DIR_ORDER.filter((d) => tagsByDir[d].some((t) => t.type === "bad"))

  );

  for (const starNum of getSupportStars(honmei)) {

    const dir = findStarDirection(chart, centerStar, starNum);

    if (dir && !badDirs.has(dir)) pushTag(dir, "吉方", "good");

  }



  const cells = {};

  for (const row of grid) {

    for (const cell of row) {

      cells[cell.dir] = {

        ...cell,

        tags: cell.isCenter ? [] : tagsByDir[cell.dir] || [],

      };

    }

  }



  return {

    kind,

    centerStar,

    centerName: STARS[centerStar].name,

    centerShort: STAR_SHORT[centerStar],

    period,

    cells,

  };

}



/**

 * 生年月日と対象日から鑑定結果を返す

 */

function calculateKigaku(birthDate, targetDate) {

  const honmei = getYearStar(getStarYear(birthDate));

  const getsumei = getMonthStar(birthDate);

  const dayStar = getDayStar(targetDate);

  const yearStar = getYearStar(getStarYear(targetDate));

  const monthStar = getMonthStar(targetDate);

  const starYear = getStarYear(targetDate);



  const dayChart = buildChart(dayStar);

  const yearChart = buildChart(yearStar);



  const yearHa = getHaDirection(getYearBranchIndex(starYear));

  const monthHa = getHaDirection(getMonthBranchIndex(getSolarMonthIndex(targetDate)));

  const dayHa = getHaDirection(getDayBranchIndex(targetDate));



  const yearBoard = buildAnnotatedBoard(yearStar, {

    honmei,

    getsumei,

    haDirection: yearHa,

    kind: "year",

    period: getYearPeriod(starYear),

  });

  const monthBoard = buildAnnotatedBoard(monthStar, {

    honmei,

    getsumei,

    haDirection: monthHa,

    kind: "month",

    period: getMonthPeriod(targetDate),

  });

  const dayBoard = buildAnnotatedBoard(dayStar, {

    honmei,

    getsumei,

    haDirection: dayHa,

    kind: "day",

    period: getDayPeriod(targetDate),

  });



  const goou = findStarDirection(dayChart, dayStar, 5);

  const anken = goou ? OPPOSITE[goou] : null;

  const yearGoou = findStarDirection(yearChart, yearStar, 5);

  const yearAnken = yearGoou ? OPPOSITE[yearGoou] : null;



  const badSet = new Set([goou, anken].filter(Boolean));

  const luckyDirs = [];

  for (const starNum of getSupportStars(honmei)) {

    const dir = findStarDirection(dayChart, dayStar, starNum);

    if (!dir || badSet.has(dir)) continue;

    if (luckyDirs.some((x) => x.direction === dir)) continue;

    luckyDirs.push({

      direction: dir,

      reason: `${STARS[starNum].name}の気が巡る方位`,

    });

  }



  return {

    honmei: {

      number: honmei,

      ...STARS[honmei],

    },

    getsumei: {

      number: getsumei,

      ...STARS[getsumei],

    },

    target: {

      dayStar: { number: dayStar, ...STARS[dayStar] },

      monthStar: { number: monthStar, ...STARS[monthStar] },

      yearStar: { number: yearStar, ...STARS[yearStar] },

      starYear,

    },

    yearBoard,

    monthBoard,

    dayBoard,

    lucky: luckyDirs.slice(0, 3),

    unlucky: [

      goou && {

        direction: goou,

        name: "五黄殺（日）",

        short: "その日、強い凶気が集まる方位です。大きな用向きの移動は控えめに。",

      },

      anken && {

        direction: anken,

        name: "暗剣殺（日）",

        short: "五黄殺の反対方位。気づきにくい凶方とされるため注意します。",

      },

      yearGoou && {

        direction: yearGoou,

        name: "五黄殺（年）",

        short: "その年の注意方位です。旅行や引越しなど大きめの移動の参考に。",

      },

      yearAnken && {

        direction: yearAnken,

        name: "暗剣殺（年）",

        short: "年の五黄殺の反対。長期の移動計画で意識すると安心です。",

      },

      yearHa && {

        direction: yearHa,

        name: "歳破",

        short: "その年の十二支の反対方位。重要事の移動は避けたい方角です。",

      },

    ].filter(Boolean),

    notes: [

      "盤は南を上にした八方位です。各方位に九星の略称と、殺・破・吉方のラベルを表示します。",

      "立春・節入り・至点は目安日で計算しています。節の境目付近は1日ずれることがあります。",

      "気学は伝統的な方位の考え方であり、科学的な断定ではありません。日々の参考としてご利用ください。",

    ],

  };

}



// ブラウザ・テスト両方から使えるようにする

if (typeof window !== "undefined") {

  window.Kigaku = {

    STARS,

    STAR_SHORT,

    DIR_ORDER,

    calculateKigaku,

    getYearStar,

    getStarYear,

    getDayStar,

    getMonthStar,

  };

}



if (typeof module !== "undefined" && module.exports) {

  module.exports = {

    STARS,

    STAR_SHORT,

    DIR_ORDER,

    calculateKigaku,

    getYearStar,

    getStarYear,

    getDayStar,

    getMonthStar,

  };

}

