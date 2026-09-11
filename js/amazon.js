/**
 * Amazonアソシエイト（開運アイテムのご紹介）
 *
 * 使い方：
 * 1. https://affiliate.amazon.co.jp/ でAmazonアソシエイトに登録する
 * 2. 発行された「アソシエイトID（トラッキングID）」を下のASSOCIATE_TAGに設定する
 *    例：const ASSOCIATE_TAG = "kigakuguide-22";
 * 3. 空文字のままだと、この機能は表示されない（安全のためのデフォルト）
 */
window.KigakuAmazon = (function () {
  const ASSOCIATE_TAG = "kigakuguide0c-22";

  /** 本命星の五行（水・土・木・金・火）ごとのおすすめキーワード */
  const ITEM_BY_ELEMENT = {
    水: { color: "ブルー", keyword: "パワーストーン ブルー" },
    土: { color: "イエロー", keyword: "パワーストーン イエロー 金運" },
    木: { color: "グリーン", keyword: "パワーストーン グリーン" },
    金: { color: "ホワイト", keyword: "パワーストーン ホワイト" },
    火: { color: "レッド", keyword: "パワーストーン レッド" },
  };

  function isEnabled() {
    return Boolean(ASSOCIATE_TAG);
  }

  function searchUrl(keyword) {
    const params = new URLSearchParams({ k: keyword });
    if (ASSOCIATE_TAG) params.set("tag", ASSOCIATE_TAG);
    return `https://www.amazon.co.jp/s?${params.toString()}`;
  }

  function itemFor(element) {
    return ITEM_BY_ELEMENT[element] || null;
  }

  return { isEnabled: isEnabled, searchUrl: searchUrl, itemFor: itemFor };
})();
