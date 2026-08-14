"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TAX_RULES } from "@/lib/sell-tax-rules";
import {
  type AcquireType,
  type Input,
  type Mode,
  type ProofItem,
  type PropertyKind,
  type Result,
  compute,
  defaultScenarioPrices,
  emptyProof,
  fmt,
  holdingText,
  judgeRegime,
  monthsBetween,
  scenarios,
  toWan
} from "@/lib/sell-tax";
import { buildTips } from "@/lib/sell-tax-advice";

/* ═══════════════════════════ 初始值 ═══════════════════════════ */

const STORAGE_KEY = "xiaofei-sell-tax-v1";

const INIT: Input = {
  mode: "quick",
  basic: {
    sellerKind: "individual",
    residency: "resident",
    city: "高雄市",
    district: "",
    propertyKind: "大樓",
    acquireType: "purchase"
  },
  deal: {
    acquireDate: "",
    sellDate: "",
    priorOwnerAcquireDate: "",
    countPriorHolding: false,
    acquirePrice: 0,
    sellPrice: 0
  },
  cost: {
    deedTax: emptyProof(),
    stampTax: emptyProof(),
    agencyFee: emptyProof(),
    govFee: emptyProof(),
    notaryFee: emptyProof(),
    buyAgentFee: emptyProof(),
    loanInterest: emptyProof(),
    improvement: emptyProof(),
    otherCost: emptyProof()
  },
  sellExpense: {
    useActual: true,
    sellAgentFee: 0,
    advertising: 0,
    cleaning: 0,
    moving: 0,
    otherExpense: 0,
    hasProof: true
  },
  selfUse: {
    household: false,
    livedSixYears: false,
    noRent: false,
    noBusiness: false,
    notUsedBefore: false
  },
  specialRate20: false,
  priorYearLoss: 0,
  land: {
    source: "unknown",
    knownAmount: 0,
    declaredValue: 0,
    priorValue: 0,
    cpiIndex: 100,
    landImproveFee: 0,
    landAnnouncedValue: 0,
    selfUseLand: false,
    landHoldYears: 0
  },
  legacy: {
    houseAssessedValue: 0,
    landAnnouncedValue: 0,
    pings: 0,
    path: "standard",
    standardRatePct: 0,
    marginalRate: 0.12
  },
  financing: { remainingLoan: 0, prepayPenaltyKnown: "unknown", prepayPenalty: 0 },
  agent: { mode: "rate", rate: TAX_RULES.defaults.agentFeeRate * 100, amount: 0 },
  escrow: { status: "undecided", rate: TAX_RULES.defaults.escrowRate, overrideAmount: null },
  admin: { ...TAX_RULES.defaults.admin },
  settlement: {
    houseTax: 0,
    landTax: 0,
    managementFee: 0,
    water: 0,
    electricity: 0,
    gas: 0,
    rentDeposit: 0,
    otherSettle: 0
  },
  other: {
    engineeringBenefitFee: { on: false, amount: 0 },
    leaseTermination: { on: false, amount: 0 },
    repairHandover: { on: false, amount: 0 },
    otherMisc: { on: false, amount: 0 }
  },
  settlementEnabled: false
};

const CITIES = [
  "高雄市", "屏東縣", "臺南市", "臺中市", "臺北市", "新北市", "桃園市",
  "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣",
  "嘉義市", "嘉義縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
];

const DISTRICTS: Record<string, string[]> = {
  高雄市: [
    "楠梓區", "左營區", "鼓山區", "三民區", "鹽埕區", "前金區", "新興區", "苓雅區",
    "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區",
    "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區",
    "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "內門區",
    "杉林區", "甲仙區", "六龜區", "茂林區", "桃源區", "那瑪夏區"
  ],
  屏東縣: [
    "屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉",
    "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉",
    "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉",
    "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"
  ]
};

const PROPERTY_KINDS: PropertyKind[] = [
  "大樓", "華廈", "公寓", "透天", "店面", "辦公室", "廠房", "土地", "預售屋", "其他"
];

const ACQUIRE_TYPES: { key: AcquireType; label: string; hint?: string }[] = [
  { key: "purchase", label: "買賣" },
  { key: "inherit", label: "繼承", hint: "取得成本與持有期間認定不同" },
  { key: "gift", label: "贈與", hint: "取得成本與持有期間認定不同" },
  { key: "spouseGift", label: "配偶贈與", hint: "得併計配偶持有期間" },
  { key: "partition", label: "分割" },
  { key: "other", label: "其他" }
];

const COST_FIELDS: { key: keyof Input["cost"]; label: string; hint?: string }[] = [
  { key: "deedTax", label: "契稅" },
  { key: "stampTax", label: "印花稅" },
  { key: "agencyFee", label: "當初的代書費" },
  { key: "govFee", label: "規費" },
  { key: "notaryFee", label: "公證／認證費" },
  { key: "buyAgentFee", label: "當初購屋的仲介費" },
  { key: "loanInterest", label: "取得房地前的金融機構借款利息", hint: "限符合規定者" },
  { key: "improvement", label: "裝潢／增建／改良／重大修繕", hint: "須為增加房屋價值或效能之支出" },
  { key: "otherCost", label: "其他依法可列成本" }
];

const ADMIN_FIELDS: { key: keyof Input["admin"]; label: string }[] = [
  { key: "contractFee", label: "簽約手續費" },
  { key: "transferFee", label: "過戶代書費" },
  { key: "extraLandParcelFee", label: "土地筆數增加費" },
  { key: "extraBuildingFee", label: "建物棟數增加費" },
  { key: "mortgageReleaseFee", label: "抵押權塗銷代書費" },
  { key: "priceRegistrationFee", label: "實價登錄代辦費" },
  { key: "otherAdminFee", label: "其他代辦費" }
];

const SETTLE_FIELDS: { key: keyof Input["settlement"]; label: string; hint?: string }[] = [
  { key: "houseTax", label: "房屋稅分攤" },
  { key: "landTax", label: "地價稅分攤" },
  { key: "managementFee", label: "管理費" },
  { key: "water", label: "水費" },
  { key: "electricity", label: "電費" },
  { key: "gas", label: "瓦斯費" },
  { key: "rentDeposit", label: "租金／押金退還", hint: "填正數代表你要付出去" },
  { key: "otherSettle", label: "其他結算" }
];

const OTHER_FIELDS: { key: keyof Input["other"]; label: string }[] = [
  { key: "engineeringBenefitFee", label: "工程受益費" },
  { key: "leaseTermination", label: "租約提前終止相關費用" },
  { key: "repairHandover", label: "修繕／點交費" },
  { key: "otherMisc", label: "其他費用" }
];

/* ═══════════════════════════ 小元件 ═══════════════════════════ */

function MoneyInput({
  value,
  onChange,
  unit = "wan",
  placeholder,
  ariaLabel
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: "wan" | "yuan";
  placeholder?: string;
  ariaLabel?: string;
}) {
  const factor = unit === "wan" ? 10_000 : 1;
  const display = value === 0 ? "" : String(value / factor);
  const [buf, setBuf] = useState(display);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setBuf(value === 0 ? "" : String(value / factor));
  }, [value, focused, factor]);

  return (
    <span className="st-money">
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={buf}
        placeholder={placeholder ?? "0"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const t = e.target.value.replace(/,/g, "");
          if (t !== "" && !/^\d*\.?\d*$/.test(t)) return;
          setBuf(t);
          onChange(t === "" ? 0 : Number(t) * factor);
        }}
      />
      <span className="st-unit">{unit === "wan" ? "萬" : "元"}</span>
    </span>
  );
}

function Row({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="st-row">
      <span className="st-row-label">
        {label}
        {hint ? <em>{hint}</em> : null}
      </span>
      <span className="st-row-field">{children}</span>
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
  hint
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className={`st-check${checked ? " on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <strong>{label}</strong>
        {hint ? <em>{hint}</em> : null}
      </span>
    </label>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { key: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="st-seg" role="group">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={value === o.key ? "on" : ""}
          onClick={() => onChange(o.key)}
          title={o.hint}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProofRow({
  label,
  hint,
  item,
  onChange
}: {
  label: string;
  hint?: string;
  item: ProofItem;
  onChange: (v: ProofItem) => void;
}) {
  return (
    <div className="st-proof">
      <Row label={label} hint={hint}>
        <MoneyInput
          unit="yuan"
          value={item.amount}
          onChange={(amount) => onChange({ ...item, amount })}
          ariaLabel={label}
        />
      </Row>
      <label className="st-proof-flag">
        <input
          type="checkbox"
          checked={item.hasProof}
          onChange={(e) => onChange({ ...item, hasProof: e.target.checked })}
        />
        <span>有單據／證明</span>
      </label>
    </div>
  );
}

/* ═══════════════════════════ 步驟定義 ═══════════════════════════ */

type StepId =
  | "basic" | "deal" | "price" | "cost" | "loan" | "selfuse"
  | "expense" | "fees" | "land" | "extra" | "result";

const STEP_DEFS: { id: StepId; title: string; advancedOnly?: boolean }[] = [
  { id: "basic", title: "你是誰、房子在哪" },
  { id: "deal", title: "什麼時候、怎麼取得" },
  { id: "price", title: "當初多少、打算賣多少" },
  { id: "cost", title: "可以列的取得成本", advancedOnly: true },
  { id: "loan", title: "房貸還剩多少" },
  { id: "selfuse", title: "自住與設籍狀況" },
  { id: "expense", title: "出售可減除的費用" },
  { id: "fees", title: "仲介費・履保・代書" },
  { id: "land", title: "土地增值稅" },
  { id: "extra", title: "交屋結算與其他", advancedOnly: true },
  { id: "result", title: "試算結果" }
];

/* ═══════════════════════════ 主元件 ═══════════════════════════ */

export default function SellTaxCalculator({ lineUrl }: { lineUrl: string }) {
  const [input, setInput] = useState<Input>(INIT);
  const [step, setStep] = useState(0);
  const [unit, setUnit] = useState<"wan" | "yuan">("wan");
  const [customPrices, setCustomPrices] = useState<number[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  /* 讀寫 localStorage：資料只留在使用者自己的裝置 */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setInput({ ...INIT, ...(JSON.parse(raw) as Input) });
    } catch {
      /* 忽略毀損的本機資料 */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* 空間不足時略過 */
    }
  }, [input, loaded]);

  const regimeNow = useMemo(() => judgeRegime(input.basic, input.deal).regime, [input.basic, input.deal]);

  // 舊制案件需要房屋評定現值等欄位，快速版也要讓他們填得到，否則永遠算不出來
  const steps = useMemo(
    () =>
      STEP_DEFS.filter(
        (s) => input.mode === "advanced" || !s.advancedOnly || (s.id === "extra" && regimeNow === "legacy")
      ),
    [input.mode, regimeNow]
  );
  const current = steps[Math.min(step, steps.length - 1)];

  const set = useCallback(<K extends keyof Input>(key: K, value: Input[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const patch = useCallback(
    <K extends keyof Input>(key: K, value: Partial<Input[K]>) => {
      setInput((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...value } as Input[K] }));
    },
    []
  );

  const result: Result = useMemo(() => compute(input), [input]);
  const tips = useMemo(() => buildTips(input, result), [input, result]);

  const priceList = useMemo(
    () => customPrices ?? defaultScenarioPrices(input.deal.sellPrice),
    [customPrices, input.deal.sellPrice]
  );
  const scenarioRows = useMemo(
    () => (input.deal.sellPrice > 0 ? scenarios(input, priceList) : []),
    [input, priceList]
  );

  const holdMonths = monthsBetween(input.deal.acquireDate, input.deal.sellDate);
  const ready = input.deal.sellPrice > 0;

  const reset = () => {
    if (!window.confirm("確定要清除所有輸入並重新開始嗎？")) return;
    setInput(INIT);
    setCustomPrices(null);
    setStep(0);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 忽略 */
    }
  };

  const money = (v: number) => fmt(v, unit);

  /* ─────────────────── 各步驟畫面 ─────────────────── */

  function renderStep() {
    switch (current.id) {
      /* ── 1. 基本資料 ── */
      case "basic":
        return (
          <>
            <Row label="賣方身分">
              <Seg
                value={input.basic.sellerKind}
                onChange={(v) => patch("basic", { sellerKind: v })}
                options={[
                  { key: "individual", label: "自然人" },
                  { key: "company", label: "公司／法人" }
                ]}
              />
            </Row>

            {input.basic.sellerKind === "company" ? (
              <p className="st-alert warn">
                法人交易涉及營利事業所得稅、營業稅等不同規定，不能直接套用自然人的房地合一稅公式。
                本工具第一版僅適用自然人，法人案件請洽會計師另外評估。
              </p>
            ) : null}

            <Row label="稅務居住者身分" hint="一般在台灣長住、有戶籍者為境內居住者">
              <Seg
                value={input.basic.residency}
                onChange={(v) => patch("basic", { residency: v })}
                options={[
                  { key: "resident", label: "中華民國境內居住者" },
                  { key: "nonResident", label: "非境內居住者" }
                ]}
              />
            </Row>

            <Row label="縣市">
              <select
                value={input.basic.city}
                onChange={(e) => patch("basic", { city: e.target.value, district: "" })}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Row>

            <Row label="行政區">
              {DISTRICTS[input.basic.city] ? (
                <select
                  value={input.basic.district}
                  onChange={(e) => patch("basic", { district: e.target.value })}
                >
                  <option value="">請選擇</option>
                  {DISTRICTS[input.basic.city].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={input.basic.district}
                  placeholder="例如：中正區"
                  onChange={(e) => patch("basic", { district: e.target.value })}
                />
              )}
            </Row>

            <Row label="房屋類型">
              <select
                value={input.basic.propertyKind}
                onChange={(e) => patch("basic", { propertyKind: e.target.value as PropertyKind })}
              >
                {PROPERTY_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Row>
          </>
        );

      /* ── 2. 取得與出售 ── */
      case "deal":
        return (
          <>
            <Row label="當初怎麼取得這間房？">
              <Seg
                value={input.basic.acquireType}
                onChange={(v) => patch("basic", { acquireType: v })}
                options={ACQUIRE_TYPES}
              />
            </Row>

            {input.basic.acquireType !== "purchase" ? (
              <p className="st-alert warn">
                「{ACQUIRE_TYPES.find((a) => a.key === input.basic.acquireType)?.label}」取得的房地，
                取得日與取得成本的認定跟一般買賣不同 —— 成本通常不是當初的買價，
                而是依規定以取得當時的房屋評定現值及公告土地現值按物價指數調整後認定。
                本工具會照你輸入的數字算，但這一段建議請地政士或國稅局確認後再定案。
              </p>
            ) : null}

            <Row label="取得日期" hint="登記日／繼承或受贈日">
              <input
                type="date"
                value={input.deal.acquireDate}
                onChange={(e) => patch("deal", { acquireDate: e.target.value })}
              />
            </Row>

            <Row label="預計出售日期" hint="以所有權移轉登記日為準">
              <input
                type="date"
                value={input.deal.sellDate}
                onChange={(e) => patch("deal", { sellDate: e.target.value })}
              />
            </Row>

            {["inherit", "gift", "spouseGift"].includes(input.basic.acquireType) ? (
              <>
                <Check
                  checked={input.deal.countPriorHolding}
                  onChange={(v) => patch("deal", { countPriorHolding: v })}
                  label="併計前手（被繼承人／贈與人／配偶）的持有期間"
                  hint="依規定部分情形可以合併計算，會影響適用稅率"
                />
                {input.deal.countPriorHolding ? (
                  <Row label="前手的取得日期">
                    <input
                      type="date"
                      value={input.deal.priorOwnerAcquireDate}
                      onChange={(e) => patch("deal", { priorOwnerAcquireDate: e.target.value })}
                    />
                  </Row>
                ) : null}
              </>
            ) : null}

            {holdMonths !== null && holdMonths >= 0 ? (
              <div className="st-callout">
                <p>
                  持有期間約 <strong>{holdingText(holdMonths)}</strong>
                </p>
                <p className="st-callout-sub">{result.regime.reason}</p>
                {result.regime.regime === "houseLand" && result.houseLand ? (
                  <p className="st-callout-sub">
                    初步適用稅率：<strong>{result.houseLand.rateLabel}</strong>
                    <br />
                    特殊交易（非自願因素、合建分回、都更危老等）可能適用不同稅率。
                  </p>
                ) : null}
              </div>
            ) : null}

            <Check
              checked={input.specialRate20}
              onChange={(v) => set("specialRate20", v)}
              label="符合法定特殊情形，適用 20% 優惠稅率"
              hint={TAX_RULES.houseLandRates.special.cases.join("；")}
            />
          </>
        );

      /* ── 3. 金額 ── */
      case "price":
        return (
          <>
            <Row
              label="原始取得價格"
              hint={
                input.basic.acquireType === "purchase"
                  ? "當初的買價"
                  : "非買賣取得者，請填依規定認定的取得成本"
              }
            >
              <MoneyInput
                value={input.deal.acquirePrice}
                onChange={(v) => patch("deal", { acquirePrice: v })}
              />
            </Row>

            <Row label="預計成交價格">
              <MoneyInput
                value={input.deal.sellPrice}
                onChange={(v) => patch("deal", { sellPrice: v })}
              />
            </Row>

            {input.deal.acquirePrice > 0 && input.deal.sellPrice > 0 ? (
              <div className="st-callout">
                <p>
                  帳面價差約{" "}
                  <strong>{money(input.deal.sellPrice - input.deal.acquirePrice)}</strong>
                </p>
                <p className="st-callout-sub">
                  這只是「賣價減買價」，還沒扣任何稅費與房貸，不等於你會拿回的錢。
                </p>
              </div>
            ) : null}
          </>
        );

      /* ── 4. 取得成本明細（進階） ── */
      case "cost":
        return (
          <>
            <p className="st-hint">
              這些是當初取得房地時付出、依法可以列入成本的支出。有單據的才容易被認列，
              請務必如實填寫；沒有的就留 0，不要用猜的。
            </p>
            {COST_FIELDS.map((f) => (
              <ProofRow
                key={f.key}
                label={f.label}
                hint={f.hint}
                item={input.cost[f.key]}
                onChange={(v) => patch("cost", { [f.key]: v } as Partial<Input["cost"]>)}
              />
            ))}
            <p className="st-alert">
              一般日常維修與使用期間的費用，不代表一定可以列為房地合一的成本。
              是否認列須符合稅法規定並視證明文件由國稅局認定。
            </p>
            <div className="st-callout">
              <p>
                目前合計取得成本約 <strong>{money(result.acquireCost)}</strong>
              </p>
              <p className="st-callout-sub">已含原始取得價格。</p>
            </div>
          </>
        );

      /* ── 5. 房貸 ── */
      case "loan":
        return (
          <>
            <Row label="目前銀行剩餘房貸本金" hint="這不是稅，但一定會從價金裡先扣掉">
              <MoneyInput
                value={input.financing.remainingLoan}
                onChange={(v) => patch("financing", { remainingLoan: v })}
              />
            </Row>

            <Row label="有沒有提前清償違約金？">
              <Seg
                value={input.financing.prepayPenaltyKnown}
                onChange={(v) => patch("financing", { prepayPenaltyKnown: v })}
                options={[
                  { key: "none", label: "沒有" },
                  { key: "yes", label: "有" },
                  { key: "unknown", label: "不知道" }
                ]}
              />
            </Row>

            {input.financing.prepayPenaltyKnown === "yes" ? (
              <Row label="違約金金額">
                <MoneyInput
                  unit="yuan"
                  value={input.financing.prepayPenalty}
                  onChange={(v) => patch("financing", { prepayPenalty: v })}
                />
              </Row>
            ) : null}

            {input.financing.prepayPenaltyKnown === "unknown" ? (
              <p className="st-alert warn">
                房貸通常有綁約期，綁約期間內提前清償可能要付違約金。
                建議打給銀行問「綁約到什麼時候、現在清償要付多少」，這筆目前沒有計入試算。
              </p>
            ) : null}
          </>
        );

      /* ── 6. 自住資格 ── */
      case "selfuse":
        return (
          <>
            <p className="st-hint">
              自住房地優惠的免稅額是 {toWan(TAX_RULES.selfUseIncomeTax.exemptIncome)} 萬元，
              金額很大，所以國稅局查得也細。下面每一項都要成立才可能適用，請照實際情況勾。
            </p>
            {TAX_RULES.selfUseIncomeTax.checks.map((c) => (
              <Check
                key={c.key}
                label={c.label}
                hint={c.hint}
                checked={input.selfUse[c.key as keyof Input["selfUse"]]}
                onChange={(v) => patch("selfUse", { [c.key]: v } as Partial<Input["selfUse"]>)}
              />
            ))}

            {result.selfUse.qualified ? (
              <p className="st-alert good">
                依目前輸入資料，你<strong>可能</strong>符合自住房地優惠：課稅所得{" "}
                {toWan(TAX_RULES.selfUseIncomeTax.exemptIncome)} 萬元以內免稅，
                超過部分適用 {(TAX_RULES.selfUseIncomeTax.rate * 100).toFixed(0)}%。
                實際是否符合仍以國稅局認定為準。
              </p>
            ) : (
              <p className="st-alert">
                目前尚有 {result.selfUse.missing.length} 項條件未勾選，本次試算不套用自住優惠。
              </p>
            )}
          </>
        );

      /* ── 7. 出售費用 ── */
      case "expense":
        return (
          <>
            <p className="st-hint">{TAX_RULES.expenseStandard.note}</p>

            <Row label="出售仲介服務費" hint="同時也是實際支出，會計入實拿">
              <MoneyInput
                unit="yuan"
                value={input.sellExpense.sellAgentFee}
                onChange={(v) => patch("sellExpense", { sellAgentFee: v })}
              />
            </Row>

            {input.mode === "advanced" ? (
              <>
                <Row label="廣告費">
                  <MoneyInput
                    unit="yuan"
                    value={input.sellExpense.advertising}
                    onChange={(v) => patch("sellExpense", { advertising: v })}
                  />
                </Row>
                <Row label="清潔費">
                  <MoneyInput
                    unit="yuan"
                    value={input.sellExpense.cleaning}
                    onChange={(v) => patch("sellExpense", { cleaning: v })}
                  />
                </Row>
                <Row label="搬運費">
                  <MoneyInput
                    unit="yuan"
                    value={input.sellExpense.moving}
                    onChange={(v) => patch("sellExpense", { moving: v })}
                  />
                </Row>
                <Row label="其他有證明之必要費用">
                  <MoneyInput
                    unit="yuan"
                    value={input.sellExpense.otherExpense}
                    onChange={(v) => patch("sellExpense", { otherExpense: v })}
                  />
                </Row>
              </>
            ) : null}

            <Check
              checked={input.sellExpense.hasProof}
              onChange={(v) => patch("sellExpense", { hasProof: v })}
              label="以上費用有合法支付證明（發票、收據、匯款紀錄等）"
              hint="沒有證明時，將改依核定標準計算"
            />

            <div className="st-callout">
              <p>
                本次可減除費用約 <strong>{money(result.expense.deductible)}</strong>
              </p>
              <p className="st-callout-sub">{result.expense.note}</p>
              <p className="st-callout-sub">
                實際填報金額 {money(result.expense.actual)}｜核定標準 {money(result.expense.standard)}
                （兩者擇一，不會重複扣除）
              </p>
            </div>
          </>
        );

      /* ── 8. 仲介・履保・代書 ── */
      case "fees":
        return (
          <>
            <h4 className="st-sub">仲介服務費</h4>
            <Row label="計算方式">
              <Seg
                value={input.agent.mode}
                onChange={(v) => patch("agent", { mode: v })}
                options={[
                  { key: "rate", label: "用百分比" },
                  { key: "amount", label: "直接填金額" }
                ]}
              />
            </Row>
            {input.agent.mode === "rate" ? (
              <Row label="服務費率">
                <span className="st-money">
                  <input
                    type="number"
                    step="0.1"
                    value={input.agent.rate}
                    onChange={(e) => patch("agent", { rate: Number(e.target.value) })}
                  />
                  <span className="st-unit">%</span>
                </span>
              </Row>
            ) : (
              <Row label="服務費金額">
                <MoneyInput
                  unit="yuan"
                  value={input.agent.amount}
                  onChange={(v) => patch("agent", { amount: v })}
                />
              </Row>
            )}
            <p className="st-note">{TAX_RULES.defaults.agentFeeNote}</p>

            <h4 className="st-sub">履約保證</h4>
            <Row label="是否使用履約保證？">
              <Seg
                value={input.escrow.status}
                onChange={(v) => patch("escrow", { status: v })}
                options={[
                  { key: "yes", label: "有" },
                  { key: "no", label: "無" },
                  { key: "undecided", label: "尚未確定" }
                ]}
              />
            </Row>
            {input.escrow.status === "yes" ? (
              <Row label="履保費金額" hint="預設以成交價萬分之三試算，可直接改">
                <MoneyInput
                  unit="yuan"
                  value={
                    input.escrow.overrideAmount ?? Math.round(input.deal.sellPrice * input.escrow.rate)
                  }
                  onChange={(v) => patch("escrow", { overrideAmount: v })}
                />
              </Row>
            ) : null}
            <p className="st-note">{TAX_RULES.defaults.escrowNote}</p>

            <h4 className="st-sub">代書／行政費用</h4>
            {ADMIN_FIELDS.map((f) => (
              <Row key={f.key} label={f.label}>
                <MoneyInput
                  unit="yuan"
                  value={input.admin[f.key]}
                  onChange={(v) => patch("admin", { [f.key]: v } as Partial<Input["admin"]>)}
                />
              </Row>
            ))}
            <p className="st-note">{TAX_RULES.defaults.adminNote}</p>

            <div className="st-callout">
              <p>
                交易服務成本合計約 <strong>{money(result.breakdown.serviceTotal)}</strong>
              </p>
            </div>
          </>
        );

      /* ── 9. 土地增值稅 ── */
      case "land":
        return (
          <>
            <p className="st-hint">
              土地增值稅<strong>不能</strong>用「賣價減買價乘以某個百分比」推估。
              它看的是土地公告現值、前次移轉現值與物價指數，跟成交價無關。
            </p>

            <Row label="你目前有土地增值稅的資料嗎？">
              <Seg
                value={input.land.source}
                onChange={(v) => patch("land", { source: v })}
                options={[
                  { key: "known", label: "已有試算金額" },
                  { key: "advanced", label: "我有土地資料，要試算" },
                  { key: "unknown", label: "都沒有" }
                ]}
              />
            </Row>

            {input.land.source === "known" ? (
              <Row label="稅務局／代書已試算的土地增值稅">
                <MoneyInput
                  unit="yuan"
                  value={input.land.knownAmount}
                  onChange={(v) => patch("land", { knownAmount: v })}
                />
              </Row>
            ) : null}

            {input.land.source === "advanced" ? (
              <>
                <Row label="本次申報移轉現值總額">
                  <MoneyInput
                    unit="yuan"
                    value={input.land.declaredValue}
                    onChange={(v) => patch("land", { declaredValue: v })}
                  />
                </Row>
                <Row label="原規定地價／前次移轉現值總額" hint="未調整前的金額">
                  <MoneyInput
                    unit="yuan"
                    value={input.land.priorValue}
                    onChange={(v) => patch("land", { priorValue: v })}
                  />
                </Row>
                <Row label="臺灣地區消費者物價總指數" hint="依前次移轉年月查對，稅務局有公告">
                  <span className="st-money">
                    <input
                      type="number"
                      step="0.01"
                      value={input.land.cpiIndex}
                      onChange={(e) => patch("land", { cpiIndex: Number(e.target.value) })}
                    />
                    <span className="st-unit">%</span>
                  </span>
                </Row>
                <Row label="得減除之土地改良費用" hint="工程受益費、重劃負擔總額、改良土地費用">
                  <MoneyInput
                    unit="yuan"
                    value={input.land.landImproveFee}
                    onChange={(v) => patch("land", { landImproveFee: v })}
                  />
                </Row>
                <Row label="本次公告土地現值總額" hint="用於房地合一土地漲價總數額減除上限">
                  <MoneyInput
                    unit="yuan"
                    value={input.land.landAnnouncedValue}
                    onChange={(v) => patch("land", { landAnnouncedValue: v })}
                  />
                </Row>
                <Row label="土地持有年數" hint="滿 20／30／40 年有長期減徵">
                  <span className="st-money">
                    <input
                      type="number"
                      value={input.land.landHoldYears || ""}
                      onChange={(e) => patch("land", { landHoldYears: Number(e.target.value) })}
                    />
                    <span className="st-unit">年</span>
                  </span>
                </Row>

                <Check
                  checked={input.land.selfUseLand}
                  onChange={(v) => patch("land", { selfUseLand: v })}
                  label="符合自用住宅用地優惠，適用 10% 稅率"
                />

                {input.land.selfUseLand ? (
                  <div className="st-quals">
                    <div>
                      <h5>一生一次 —— 需同時符合</h5>
                      <ul>
                        {TAX_RULES.landIncrementTax.onceInLifetime.map((q) => (
                          <li key={q.key}>{q.label}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5>一生一屋 —— 已用過一生一次者</h5>
                      <ul>
                        {TAX_RULES.landIncrementTax.onceInLifetimeHouse.map((q) => (
                          <li key={q.key}>{q.label}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="st-alert">
                      你可能符合自用住宅用地 10% 優惠，但一生一次／一生一屋的認定條件很細，
                      建議出售前先向地方稅務局或代書確認。
                    </p>
                  </div>
                ) : null}

                {result.land.status === "ok" ? (
                  <div className="st-callout">
                    <p>
                      土地增值稅初估約 <strong>{money(result.land.amount)}</strong>
                    </p>
                    <p className="st-callout-sub">
                      土地漲價總數額 {money(result.land.incrementTotal)}
                      {result.land.multiple !== null
                        ? `｜漲價倍數約 ${result.land.multiple.toFixed(2)} 倍`
                        : ""}
                      <br />
                      {result.land.tierLabel}
                    </p>
                    <p className="st-callout-sub">{result.land.note}</p>
                  </div>
                ) : (
                  <p className="st-alert warn">{result.land.note}</p>
                )}
              </>
            ) : null}

            {input.land.source === "unknown" ? (
              <p className="st-alert warn">
                土地增值稅需要前次移轉現值、本次申報移轉現值等土地資料才能較準確計算。
                目前資料不足，結果頁會標示「土地增值稅尚未計入」。
                <br />
                你可以先調土地謄本，或請地方稅務局／代書試算後，把金額填回上面的「已有試算金額」。
              </p>
            ) : null}

            <p className="st-note">
              提醒：土地增值稅與房地合一課稅所得裡的「土地漲價總數額」是兩個不同概念，
              本工具已分開處理，不會重複扣除。
            </p>
          </>
        );

      /* ── 10. 交屋結算與其他（進階） ── */
      case "extra":
        return (
          <>
            <h4 className="st-sub">交屋結算費用</h4>
            <p className="st-alert">
              {TAX_RULES.holdingTaxBaseDates.houseTax.label}以{TAX_RULES.holdingTaxBaseDates.houseTax.baseDate}
              為納稅義務基準日；{TAX_RULES.holdingTaxBaseDates.landTax.label}以
              {TAX_RULES.holdingTaxBaseDates.landTax.baseDate}為納稅義務基準日。
              <br />
              {TAX_RULES.holdingTaxBaseDates.warning}
              下面填的是「你與買方在契約上約定要分攤的金額」。
            </p>

            <Check
              checked={input.settlementEnabled}
              onChange={(v) => set("settlementEnabled", v)}
              label="依契約約定試算交屋分攤"
            />

            {input.settlementEnabled
              ? SETTLE_FIELDS.map((f) => (
                  <Row key={f.key} label={f.label} hint={f.hint}>
                    <MoneyInput
                      unit="yuan"
                      value={input.settlement[f.key]}
                      onChange={(v) =>
                        patch("settlement", { [f.key]: v } as Partial<Input["settlement"]>)
                      }
                    />
                  </Row>
                ))
              : null}

            <h4 className="st-sub">其他可能費用</h4>
            {OTHER_FIELDS.map((f) => (
              <div key={f.key}>
                <Check
                  checked={input.other[f.key].on}
                  onChange={(v) =>
                    patch("other", {
                      [f.key]: { ...input.other[f.key], on: v }
                    } as Partial<Input["other"]>)
                  }
                  label={f.label}
                />
                {input.other[f.key].on ? (
                  <Row label={`${f.label}金額`}>
                    <MoneyInput
                      unit="yuan"
                      value={input.other[f.key].amount}
                      onChange={(v) =>
                        patch("other", {
                          [f.key]: { ...input.other[f.key], amount: v }
                        } as Partial<Input["other"]>)
                      }
                    />
                  </Row>
                ) : null}
              </div>
            ))}

            <h4 className="st-sub">其他稅務資料</h4>
            <Row label="可扣除之以前年度房地交易損失" hint="限依法得扣除者">
              <MoneyInput
                unit="yuan"
                value={input.priorYearLoss}
                onChange={(v) => set("priorYearLoss", v)}
              />
            </Row>

            {result.regime.regime === "legacy" ? (
              <>
                <h4 className="st-sub">舊制財產交易所得資料</h4>
                <Row label="房屋評定現值" hint="房屋稅單上找得到">
                  <MoneyInput
                    unit="yuan"
                    value={input.legacy.houseAssessedValue}
                    onChange={(v) => patch("legacy", { houseAssessedValue: v })}
                  />
                </Row>
                <Row label="公告土地現值總額" hint="地價稅單或謄本上找得到">
                  <MoneyInput
                    unit="yuan"
                    value={input.legacy.landAnnouncedValue}
                    onChange={(v) => patch("legacy", { landAnnouncedValue: v })}
                  />
                </Row>
                <Row label="房屋坪數">
                  <span className="st-money">
                    <input
                      type="number"
                      step="0.01"
                      value={input.legacy.pings || ""}
                      onChange={(e) => patch("legacy", { pings: Number(e.target.value) })}
                    />
                    <span className="st-unit">坪</span>
                  </span>
                </Row>
                <Row label="計算路徑">
                  <Seg
                    value={input.legacy.path}
                    onChange={(v) => patch("legacy", { path: v })}
                    options={[
                      { key: "actual", label: "有實際成本證明" },
                      { key: "standard", label: "無完整成本證明" }
                    ]}
                  />
                </Row>
                {input.legacy.path === "standard" ? (
                  <Row
                    label="財政部公告之該行政區比率"
                    hint="非高總價案件才需要；請查當年度公告後填入"
                  >
                    <span className="st-money">
                      <input
                        type="number"
                        step="0.1"
                        value={input.legacy.standardRatePct || ""}
                        onChange={(e) =>
                          patch("legacy", { standardRatePct: Number(e.target.value) })
                        }
                      />
                      <span className="st-unit">%</span>
                    </span>
                  </Row>
                ) : null}
                <Row label="你的綜合所得稅邊際稅率" hint="用來粗估併入綜所稅後的稅額">
                  <select
                    value={input.legacy.marginalRate}
                    onChange={(e) => patch("legacy", { marginalRate: Number(e.target.value) })}
                  >
                    {TAX_RULES.legacyPropertyIncome.marginalRates.map((r) => (
                      <option key={r} value={r}>
                        {(r * 100).toFixed(0)}%
                      </option>
                    ))}
                  </select>
                </Row>
                <p className="st-note">{TAX_RULES.legacyPropertyIncome.note}</p>
              </>
            ) : null}
          </>
        );

      /* ── 11. 結果 ── */
      case "result":
        // 用函式呼叫而非 <ResultView />：巢狀元件每次 render 都是新型別，
        // React 會整段重掛，情境模擬的輸入框會一打字就失焦。
        return renderResult();

      default:
        return null;
    }
  }

  /* ─────────────────── 結果頁 ─────────────────── */

  function renderResult() {
    const b = result.breakdown;

    if (!ready) {
      return (
        <p className="st-alert warn">
          還沒有輸入預計成交價格，沒辦法算實拿。請回到「當初多少、打算賣多少」把成交價填上。
        </p>
      );
    }

    const lines: { label: string; value: number; kind: string }[] = [
      { label: "剩餘房貸", value: b.remainingLoan, kind: "finance" },
      { label: "土地增值稅", value: b.landIncrementTax, kind: "gov" },
      { label: b.incomeTaxLabel, value: b.incomeTax, kind: "gov" },
      { label: "仲介服務費", value: b.agentFee, kind: "service" },
      { label: "履約保證費", value: b.escrowFee, kind: "service" },
      { label: "代書及行政費", value: b.adminFee, kind: "service" },
      { label: "提前清償違約金", value: b.prepayPenalty, kind: "finance" },
      { label: "交屋結算", value: b.settlement, kind: "settle" },
      { label: "其他費用", value: b.other, kind: "other" }
    ];

    return (
      <div className="st-result">
        <p className="st-result-lead">如果這間房成交 {money(b.sellPrice)}</p>

        <div className="st-ledger">
          <div className="st-ledger-row head">
            <span>成交價</span>
            <strong>{money(b.sellPrice)}</strong>
          </div>
          {lines.map((l) => (
            <div key={l.label} className={`st-ledger-row${l.value === 0 ? " zero" : ""}`}>
              <span>－ {l.label}</span>
              <strong>{l.value === 0 ? "－" : money(l.value)}</strong>
            </div>
          ))}
          <div className="st-ledger-row total">
            <span>＝ 預估最後實拿</span>
            <strong>{money(b.netProceeds)}</strong>
          </div>
        </div>

        <div className={`st-net${b.netProceeds < 0 ? " danger" : ""}`}>
          <p className="st-net-label">預估實拿</p>
          <p className="st-net-value">約 {money(b.netProceeds)}</p>
          {result.uncounted.length > 0 ? (
            <p className="st-net-warn">
              以下項目因資料不足尚未計入：{result.uncounted.join("、")}。實際金額會低於此數字。
            </p>
          ) : null}
        </div>

        {result.warnings.map((w, i) => (
          <p key={i} className="st-alert warn">{w}</p>
        ))}

        {/* 分類 */}
        <h4 className="st-sub">這些錢分別是誰收走的</h4>
        <div className="st-groups">
          <div className="st-group gov">
            <h5>政府稅負 {money(b.govTotal)}</h5>
            <ul>
              <li><span>土地增值稅</span><b>{money(b.landIncrementTax)}</b></li>
              <li><span>{b.incomeTaxLabel}</span><b>{money(b.incomeTax)}</b></li>
            </ul>
          </div>
          <div className="st-group service">
            <h5>交易服務成本 {money(b.serviceTotal)}</h5>
            <ul>
              <li><span>仲介服務費</span><b>{money(b.agentFee)}</b></li>
              <li><span>履約保證費</span><b>{money(b.escrowFee)}</b></li>
              <li><span>代書及行政費</span><b>{money(b.adminFee)}</b></li>
            </ul>
          </div>
          <div className="st-group finance">
            <h5>財務成本 {money(b.financeTotal)}</h5>
            <ul>
              <li><span>剩餘房貸</span><b>{money(b.remainingLoan)}</b></li>
              <li><span>提前清償違約金</span><b>{money(b.prepayPenalty)}</b></li>
            </ul>
          </div>
          <div className="st-group settle">
            <h5>交屋結算 {money(b.settlement)}</h5>
            <ul>
              <li><span>房屋稅／地價稅分攤</span><b>{money(input.settlementEnabled ? input.settlement.houseTax + input.settlement.landTax : 0)}</b></li>
              <li><span>管理費、水電瓦斯等</span><b>{money(b.settlement - (input.settlementEnabled ? input.settlement.houseTax + input.settlement.landTax : 0))}</b></li>
            </ul>
          </div>
        </div>
        <p className="st-note">
          房貸是把原本就欠銀行的錢還掉，不是被政府或仲介拿走 —— 分開看才不會誤會。
        </p>

        {/* 損益分析 */}
        <h4 className="st-sub">損益分析</h4>
        <div className="st-ledger compact">
          <div className="st-ledger-row"><span>原始取得成本</span><strong>{money(result.acquireCost)}</strong></div>
          <div className="st-ledger-row"><span>出售成交價</span><strong>{money(b.sellPrice)}</strong></div>
          <div className="st-ledger-row"><span>帳面價差</span><strong>{money(b.sellPrice - result.acquireCost)}</strong></div>
          {result.houseLand ? (
            <>
              <div className="st-ledger-row">
                <span>扣除可認列成本／費用後之房地交易所得</span>
                <strong>{money(result.houseLand.tradeIncome)}</strong>
              </div>
              <div className="st-ledger-row">
                <span>減除土地漲價總數額後之課稅所得</span>
                <strong>{money(result.houseLand.taxableIncome)}</strong>
              </div>
            </>
          ) : null}
          {result.legacy && result.legacy.status === "ok" ? (
            <div className="st-ledger-row">
              <span>舊制房屋財產交易所得</span>
              <strong>{money(result.legacy.income)}</strong>
            </div>
          ) : null}
          <div className="st-ledger-row"><span>預估稅負合計</span><strong>{money(b.govTotal)}</strong></div>
          <div className="st-ledger-row total"><span>最後現金實拿</span><strong>{money(b.netProceeds)}</strong></div>
        </div>
        <p className="st-note">帳面上賣價比買價高，不代表真正淨賺相同金額。</p>

        {/* 稅制與稅率說明 */}
        <h4 className="st-sub">稅制判斷</h4>
        <div className="st-callout">
          <p>
            持有期間約 <strong>{result.holdingLabel}</strong>
          </p>
          <p className="st-callout-sub">{result.regime.reason}</p>
          {result.houseLand ? (
            <>
              <p className="st-callout-sub">
                初步適用稅率：<strong>{result.houseLand.rateLabel}</strong>
                {result.houseLand.selfUseApplied ? "（已套用自住優惠）" : ""}
              </p>
              {result.houseLand.notes.map((n, i) => (
                <p key={i} className="st-callout-sub">{n}</p>
              ))}
            </>
          ) : null}
          {result.legacy ? (
            <>
              {result.legacy.method ? (
                <p className="st-callout-sub">計算方式：{result.legacy.method}</p>
              ) : null}
              {result.legacy.notes.map((n, i) => (
                <p key={i} className="st-callout-sub">{n}</p>
              ))}
            </>
          ) : null}
          <p className="st-callout-sub">{result.land.note}</p>
        </div>

        {/* 情境模擬 */}
        <h4 className="st-sub">如果賣不同價格，我實拿多少</h4>
        <div className="st-scenarios">
          <table>
            <thead>
              <tr>
                <th>成交價</th>
                {/* 窄螢幕隱藏這欄，讓「預估實拿」與「與目前差」完整顯示 */}
                <th className="st-col-tax">政府稅負</th>
                <th>預估實拿</th>
                <th>與目前差</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((s) => (
                <tr key={s.price} className={s.price === b.sellPrice ? "on" : ""}>
                  <td>{money(s.price)}</td>
                  <td className="st-col-tax">{money(s.tax)}</td>
                  <td><b>{money(s.net)}</b></td>
                  <td className={s.diff > 0 ? "up" : s.diff < 0 ? "down" : ""}>
                    {s.diff === 0 ? "—" : `${s.diff > 0 ? "+" : "−"}${money(Math.abs(s.diff))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="st-note">
            每個價格都是整組重新計算 —— 房地合一所得、仲介費、履保費會跟著變，
            但土地增值稅看的是土地公告現值，不會因為成交價高低而改變。
          </p>
          <div className="st-scenario-edit">
            <span>自訂比較價格（萬元，用逗號分隔）：</span>
            <input
              type="text"
              placeholder="例如 1180, 1230, 1280, 1330"
              onChange={(e) => {
                const list = e.target.value
                  .split(/[,，\s]+/)
                  .map((t) => Number(t.trim()))
                  .filter((n) => Number.isFinite(n) && n > 0)
                  .map((n) => n * 10_000);
                setCustomPrices(list.length ? list.slice(0, 5) : null);
              }}
            />
          </div>
        </div>

        {/* 小飛提醒 */}
        {tips.length > 0 ? (
          <>
            <h4 className="st-sub">小飛提醒</h4>
            <div className="st-tips">
              {tips.map((t, i) => (
                <div key={i} className={`st-tip ${t.tone}`}>
                  <p className="st-tip-title">{t.title}</p>
                  <p className="st-tip-body">{t.body}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="st-cta">
          <p>
            土地增值稅要土地謄本才算得準、自住優惠要確認設籍與 6 年內的出租營業紀錄 ——
            這兩項是這份試算裡最容易差很多的地方。要我幫你把這兩塊補起來，直接找我。
          </p>
          <a className="btn btn-line" href={lineUrl} target="_blank" rel="noopener noreferrer">
            加 LINE 問小飛
          </a>
        </div>

        <div className="st-actions no-print">
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            列印／存成 PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={copySummary}>
            複製文字摘要
          </button>
        </div>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);

  function copySummary() {
    const b = result.breakdown;
    const lines = [
      "【小飛賣房稅費＆實拿試算】",
      `成交價：${money(b.sellPrice)}`,
      `－ 剩餘房貸：${money(b.remainingLoan)}`,
      `－ 土地增值稅：${money(b.landIncrementTax)}`,
      `－ ${b.incomeTaxLabel}：${money(b.incomeTax)}`,
      `－ 仲介服務費：${money(b.agentFee)}`,
      `－ 履約保證費：${money(b.escrowFee)}`,
      `－ 代書及行政費：${money(b.adminFee)}`,
      `－ 提前清償違約金：${money(b.prepayPenalty)}`,
      `－ 交屋結算：${money(b.settlement)}`,
      `－ 其他費用：${money(b.other)}`,
      `＝ 預估最後實拿：約 ${money(b.netProceeds)}`,
      "",
      `持有期間：${result.holdingLabel}`,
      `適用制度：${result.regime.reason}`
    ];
    if (result.uncounted.length) lines.push(`尚未計入：${result.uncounted.join("、")}`);
    lines.push("", "本試算僅供參考，不代表稅捐機關正式核定結果。");

    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => window.alert("複製失敗，請手動選取內容。"));
  }

  /* ─────────────────── 版面 ─────────────────── */

  return (
    <div className="st-wrap">
      {/* 模式切換 */}
      <div className="st-modebar no-print">
        <Seg
          value={input.mode}
          onChange={(v) => {
            set("mode", v as Mode);
            setStep(0);
          }}
          options={[
            { key: "quick", label: "快速估算" },
            { key: "advanced", label: "進階試算" }
          ]}
        />
        <div className="st-modebar-right">
          <Seg
            value={unit}
            onChange={setUnit}
            options={[
              { key: "wan", label: "萬元" },
              { key: "yuan", label: "元" }
            ]}
          />
          <button type="button" className="st-reset" onClick={reset}>
            清除重算
          </button>
        </div>
      </div>

      <p className="st-modehint no-print">
        {input.mode === "quick"
          ? "快速估算：資料少、快速知道大方向。不知道前次移轉現值、物價指數也沒關係。"
          : "進階試算：輸入完整土地與成本資料，結果會更接近實際。適合房仲、代書或資料齊全的屋主。"}
      </p>

      {/* 步驟列 */}
      <ol className="st-steps no-print">
        {steps.map((s, i) => (
          <li key={s.id} className={i === step ? "on" : i < step ? "done" : ""}>
            <button type="button" onClick={() => setStep(i)}>
              <span className="st-step-no">{i + 1}</span>
              <span className="st-step-title">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* 內容 */}
      <section className="st-panel">
        <h3 className="st-panel-title">
          <span>Step {step + 1}</span>
          {current.title}
        </h3>
        {renderStep()}
      </section>

      {/* 上下步 */}
      <div className="st-nav no-print">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          ← 上一步
        </button>
        <span className="st-nav-count">
          {step + 1} / {steps.length}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={step >= steps.length - 1}
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
        >
          下一步 →
        </button>
      </div>

      {/* 手機底部即時實拿 */}
      {ready && current.id !== "result" ? (
        <div className="st-sticky no-print">
          <div>
            <span>預估實拿</span>
            <strong>{money(result.breakdown.netProceeds)}</strong>
          </div>
          <button type="button" onClick={() => setStep(steps.length - 1)}>
            看完整結果
          </button>
        </div>
      ) : null}

      {copied ? <div className="st-toast">已複製到剪貼簿</div> : null}
    </div>
  );
}
