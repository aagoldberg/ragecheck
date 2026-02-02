import { NextRequest, NextResponse } from "next/server";

// Map ISO country codes to language names
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  // Spanish-speaking
  ES: "Spanish", MX: "Spanish", AR: "Spanish", CO: "Spanish", CL: "Spanish",
  PE: "Spanish", VE: "Spanish", EC: "Spanish", GT: "Spanish", CU: "Spanish",
  BO: "Spanish", DO: "Spanish", HN: "Spanish", PY: "Spanish", SV: "Spanish",
  NI: "Spanish", CR: "Spanish", PA: "Spanish", UY: "Spanish",
  // French-speaking
  FR: "French", BE: "French", CH: "French", CA: "French", SN: "French",
  CI: "French", ML: "French", BF: "French", NE: "French", TG: "French",
  BJ: "French", CD: "French", MG: "French", CM: "French", HT: "French",
  // German-speaking
  DE: "German", AT: "German",
  // Portuguese-speaking
  BR: "Portuguese", PT: "Portuguese", AO: "Portuguese", MZ: "Portuguese",
  // Italian
  IT: "Italian",
  // Dutch
  NL: "Dutch",
  // Polish
  PL: "Polish",
  // Russian-speaking
  RU: "Russian", BY: "Russian", KZ: "Russian", KG: "Russian",
  // Japanese
  JP: "Japanese",
  // Korean
  KR: "Korean",
  // Chinese-speaking
  CN: "Chinese", TW: "Chinese", HK: "Chinese",
  // Arabic-speaking
  SA: "Arabic", EG: "Arabic", AE: "Arabic", IQ: "Arabic", MA: "Arabic",
  DZ: "Arabic", SD: "Arabic", YE: "Arabic", SY: "Arabic", TN: "Arabic",
  JO: "Arabic", LB: "Arabic", LY: "Arabic", OM: "Arabic", KW: "Arabic",
  QA: "Arabic", BH: "Arabic",
  // Hindi
  IN: "Hindi",
  // Turkish
  TR: "Turkish",
};

export async function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") || "";

  const language = COUNTRY_LANGUAGE_MAP[country] || null;

  return NextResponse.json({ country, language });
}
