/**
 * 吉方位ナビ（軽量版）
 * 現在地から吉方位の方角に少し進んだ地点を中心に、
 * Googleマップでスポット検索を開く。
 * 地図APIキーは使わず、検索URLを開くだけの簡易実装。
 */
window.KigakuSpot = (function () {
  const BEARING_DEG = {
    北: 0,
    北東: 45,
    東: 90,
    南東: 135,
    南: 180,
    南西: 225,
    西: 270,
    北西: 315,
  };

  const KEYWORD_BY_KIND = {
    shrine: "神社",
    cafe: "カフェ",
    park: "公園",
  };

  const SEARCH_DISTANCE_KM = 2;

  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }
  function toDeg(rad) {
    return (rad * 180) / Math.PI;
  }

  /** 出発点・方位角(度)・距離(km)から目的地の緯度経度を求める（球面三角法） */
  function destinationPoint(lat, lng, bearingDeg, distanceKm) {
    const R = 6371;
    const delta = distanceKm / R;
    const theta = toRad(bearingDeg);
    const phi1 = toRad(lat);
    const lambda1 = toRad(lng);

    const phi2 = Math.asin(
      Math.sin(phi1) * Math.cos(delta) +
        Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
    );
    const lambda2 =
      lambda1 +
      Math.atan2(
        Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
      );

    return { lat: toDeg(phi2), lng: toDeg(lambda2) };
  }

  function openMapsSearch(keyword, lat, lng) {
    const url =
      `https://www.google.com/maps/search/${encodeURIComponent(keyword)}` +
      `/@${lat},${lng},15z`;
    window.open(url, "_blank", "noopener");
  }

  /**
   * 指定方位・種類のスポットを地図アプリで開く
   * @param {string} directionJa 「南東」などの方位名
   * @param {string} kind "shrine" | "cafe" | "park"
   * @param {(message: string) => void} onError
   */
  function findSpot(directionJa, kind, onError) {
    const bearing = BEARING_DEG[directionJa];
    const keyword = KEYWORD_BY_KIND[kind];
    if (bearing === undefined || !keyword) {
      onError && onError("方位の情報が正しく取得できませんでした。");
      return;
    }
    if (!navigator.geolocation) {
      onError && onError("この端末・ブラウザでは現在地を取得できません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const dest = destinationPoint(
          pos.coords.latitude,
          pos.coords.longitude,
          bearing,
          SEARCH_DISTANCE_KM
        );
        openMapsSearch(keyword, dest.lat, dest.lng);
      },
      function () {
        onError &&
          onError(
            "現在地を取得できませんでした。位置情報の利用を許可してください。"
          );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return { findSpot: findSpot };
})();
