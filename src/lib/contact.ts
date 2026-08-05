/** 客戶可以勾選的服務需求 */
export const INTENTS = [
  { key: "buy", label: "買房" },
  { key: "sell", label: "賣房" },
  { key: "rent", label: "租賃" },
  { key: "furniture", label: "家具租賃" },
  { key: "video", label: "影音拍攝" },
  { key: "tax", label: "稅務諮詢" },
  { key: "renovation", label: "簡易裝潢" },
  { key: "other", label: "其他" }
] as const;

/** 客戶預計處理的時間 */
export const URGENCIES = [
  { key: "asap", label: "這個月內" },
  { key: "soon", label: "1 至 3 個月" },
  { key: "explore", label: "先了解" }
] as const;

/** 方便聯絡的時段 */
export const CONTACT_TIMES = [
  { key: "anytime", label: "隨時可以" },
  { key: "morning", label: "上午" },
  { key: "afternoon", label: "下午" },
  { key: "evening", label: "晚上" }
] as const;

/** 客戶偏好的聯絡方式 */
export const CONTACT_METHODS = [
  { key: "phone", label: "電話" },
  { key: "line", label: "LINE" }
] as const;

export const INTENT_KEYS = INTENTS.map((item) => item.key) as readonly string[];
export const URGENCY_KEYS = URGENCIES.map((item) => item.key) as readonly string[];
export const CONTACT_TIME_KEYS = CONTACT_TIMES.map((item) => item.key) as readonly string[];
export const CONTACT_METHOD_KEYS = CONTACT_METHODS.map((item) => item.key) as readonly string[];

export function intentLabel(key: string) {
  return INTENTS.find((item) => item.key === key)?.label ?? key;
}

export function urgencyLabel(key: string | null) {
  return URGENCIES.find((item) => item.key === key)?.label ?? "未填";
}

export function contactTimeLabel(key: string | null) {
  return CONTACT_TIMES.find((item) => item.key === key)?.label ?? "未填";
}

export function contactMethodLabel(key: string | null) {
  return CONTACT_METHODS.find((item) => item.key === key)?.label ?? "未填";
}

export type ContactEnquiry = {
  name: string;
  phone: string;
  lineId: string;
  preferredMethod: string;
  preferredTime: string;
  intent: string[];
  urgency: string;
  note: string;
  submittedAt: string;
};
