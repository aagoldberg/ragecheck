// Curated lexicons for ragebait detection signals
// Each lexicon is designed for a specific signal type

// ============================================
// AROUSAL LEXICONS
// ============================================

export const EMOTION_ANGER_FEAR_DISGUST = [
  // Anger
  "furious", "enraged", "outraged", "livid", "seething", "infuriated",
  "incensed", "irate", "wrathful", "apoplectic", "angry", "rage", "raging",
  "hate", "hateful", "hatred", "despise", "loathe",
  // "frustrated/frustrating" removed — too common in legitimate personal venting
  "annoyed", "annoying",
  "fed up", "sick of", "tired of", "had enough",
  // Fear
  "terrified", "terrifying", "horrified", "horrifying", "frightening",
  "alarming", "chilling", "nightmarish", "harrowing", "scary", "afraid",
  "dangerous", "threat", "threatening", "deadly", "worried", "concerning",
  // Disgust
  "disgusting", "disgusted", "revolting", "repulsive", "sickening",
  "nauseating", "vile", "loathsome", "repugnant", "abhorrent", "gross",
  "awful", "horrible", "horrendous", "appalling", "pathetic", "ridiculous",
  // Destruction/violence
  "destroy", "destroying", "destroyed", "destruction",
  "attack", "attacking", "attacked", "attacks",
  "war", "fight", "fighting", "battle",
];

export const URGENCY_WORDS = [
  // "now" and "right now" removed — too generic, causes false positives
  "immediately", "urgent", "urgently", "breaking", "just in",
  "shocking", "unacceptable", "unbelievable", "incredible", "outrageous",
  "must see", "must read", "must watch", "can't wait",
  "this just happened", "happening now", "developing",
  "act now", "before it's too late", "time is running out",
  "crisis", "emergency", "critical", "dire", "desperate",
  "spread the word", "share this", "share before",
  "exposed", "exposed:",
];

// Context-dependent urgency (require surrounding manipulation context)
export const URGENCY_PATTERNS = [
  /\bNOW\b/, // Only match "NOW" in all caps (intentional emphasis)
  /\bright now\b.*\b(?:share|act|fight|wake|stop)\b/i,
  /\b(?:share|act|fight|wake|stop)\b.*\bright now\b/i,
];

export const INTENSIFIERS = [
  "literally", "absolutely", "completely", "totally", "utterly",
  "insane", "insanely", "crazy", "incredibly", "extremely",
  "unbelievably", "shockingly", "disgustingly", "horrifically",
  "massively", "hugely", "enormously", "monumentally",
];

// ============================================
// ENEMY CONSTRUCTION LEXICONS
// ============================================

export const GROUP_GENERALIZATIONS = [
  "they all", "all of them", "these people", "those people",
  "the left", "the right", "leftists", "rightists",
  "liberals", "conservatives", "democrats", "republicans",
  "the elites", "the establishment", "the media", "mainstream media",
  "big tech", "big pharma", "globalists", "deep state",
  "every single one", "not a single one",
  "the other side", "those who", "anyone who supports",
  "their kind", "people who", "the radical",
  "politicians", "bureaucrats", "officials",
];

export const MALICIOUS_INTENT_PATTERNS = [
  /they want to/i,
  /they're trying to/i,
  /they are trying to/i,
  /their goal is to/i,
  /their plan is to/i,
  /they're plotting/i,
  /they intend to/i,
  /they aim to/i,
  /they seek to destroy/i,
  /they won't stop until/i,
  /they're coming for/i,
  /they are coming for/i,
  /coming for your/i,
  /coming for our/i,
  /they want your/i,
  /they want our/i,
  /take everything/i,
  /steal our/i,
  /destroy our/i,
  /destroy us/i,
  /agenda to/i,
  /radical agenda/i,
  /hidden agenda/i,
  /their agenda/i,
  // Conspiracy / suppression patterns
  /doesn't want you to (?:see|know|hear)/i,
  /don't want you to (?:see|know|hear)/i,
  /they're hiding/i,
  /they are hiding/i,
  /cover(?:ing)? (?:it )?up/i,
  /about to ban/i,
  /trying to silence/i,
  /trying to censor/i,
];

export const DEHUMANIZATION_TERMS = [
  "vermin", "rats", "roaches", "cockroaches", "parasites", "pests",
  "infestation", "plague", "disease", "cancer", "tumor",
  // "animals" removed — too many false positives (pet posts, wildlife, etc.)
  "beasts", "monsters", "demons", "devils",
  "scum", "filth", "trash", "garbage",
  // "waste" removed — too generic ("waste of time" is contempt, not dehumanization)
  "subhuman", "inhuman", "less than human",
  // "slaves" removed — too much legitimate historical/labor discussion
  "sheep", "sheeple", "zombies", "puppets",
  "brainwashed", "mindless", "idiots", "morons", "fools",
];

// Context-dependent dehumanization patterns (require "they/them/these" + term)
export const DEHUMANIZATION_PATTERNS = [
  /\b(?:they|them|these|those) (?:are |are all )?(?:animals|savages|vermin|scum)\b/i,
  /\blike (?:animals|rats|roaches|parasites|cockroaches)\b/i,
  /\bthese (?:creatures|things)\b/i,
];

export const SCAPEGOAT_PATTERNS = [
  /is to blame for/i,
  /are to blame for/i,
  /is responsible for all/i,
  /are responsible for all/i,
  /caused all of/i,
  /ruined everything/i,
  /destroyed everything/i,
  /is the reason why/i,
  /are the reason why/i,
  /because of them/i,
  /it's their fault/i,
];

// ============================================
// MORAL CONDEMNATION LEXICONS
// ============================================

export const MORAL_JUDGMENT_TERMS = [
  "evil", "wicked", "sinful", "immoral", "corrupt", "corrupted",
  "traitor", "traitors", "treason", "treasonous", "treachery",
  "disgrace", "disgraceful", "shameful", "shameless", "shamed",
  "despicable", "deplorable", "reprehensible", "inexcusable",
  "unforgivable", "criminal", "criminals", "villains",
  // Social shaming
  "publicly shamed", "name and shame", "cancel", "cancelled",
  "should be fired", "should be arrested", "should be banned",
  "no excuse", "no excuses", "inexcusable",
];

export const PURITY_CONTAMINATION = [
  "poison", "poisoning", "poisoned", "toxic", "toxicity",
  "infect", "infecting", "infected", "infection", "infectious",
  "rot", "rotting", "rotten", "decay", "decaying",
  "corrupt", "corrupting", "corrupted", "corruption",
  "pollute", "polluted", "polluting", "pollution", "contaminate", "contaminated",
  "taint", "tainted", "defile", "defiled", "desecrate",
  "filth", "filthy", "dirty", "unclean", "impure",
];

export const BETRAYAL_FRAMING = [
  "sold out", "selling out", "sellout", "sellouts",
  "backstab", "backstabbed", "backstabbing", "backstabber",
  "betray", "betrayed", "betrayal", "betrayer",
  "turncoat", "judas", "snake", "snakes",
  "double-cross", "two-faced", "liar", "liars",
  "lies", "lying", "lie", "lied", "deceive", "deceived",
  "fake", "phony", "fraud", "frauds", "fraudulent",
  "empty promises", "broken promises", "failed to deliver",
];

// ============================================
// SIMPLIFICATION LEXICONS
// ============================================

export const ABSOLUTIST_TERMS = [
  "always", "never", "everyone", "no one", "nobody",
  "everyone knows", "no one is talking about",
  "all of them", "none of them", "every single",
  "without exception", "in every case",
  "the only", "only way", "no other", "nothing else",
  "100%", "zero", "impossible", "guaranteed",
  "everything", "entire", "complete",
  "forever", "won't stop", "can't stop", "don't stop",
  "totally", "completely", "absolutely", "entirely",
  "only choice", "no choice", "no alternative",
];

export const FALSE_DILEMMA_PATTERNS = [
  /either.{1,50}or/i,  // Limit to 50 chars between either/or
  /you're either.{1,40}or/i,
  /only two (options|choices|ways)/i,
  /there are only two/i,
  /pick a side/i,
  /with us or against us/i,
  /no middle ground/i,
  /you have to choose/i,
];

export const CAUSAL_OVERSIMPLIFICATION = [
  "this is why", "the reason is", "that's why",
  "it's simple", "it's obvious", "obviously",
  "clearly", "the answer is simple",
  "all you need to know", "bottom line",
  "plain and simple", "end of story", "period",
  "case closed", "that's all there is to it",
  "clearly failed", "obviously failed", "total failure",
  "just doesn't get it", "don't get it", "doesn't understand",
  "when will they learn", "they never learn",
];

// ============================================
// CALL-TO-CONFLICT LEXICONS
// ============================================

export const REPLY_BAIT_TEMPLATES = [
  "how is this allowed",
  "why is nobody talking about this",
  "why is no one talking about",
  "you can't make this up",
  "i can't believe",
  "look at this",
  "imagine thinking",
  "tell me you're",
  "tell me without telling me",
  "let that sink in",
  "read that again",
  "say it louder",
  "this is what happens when",
  "this is what they want",
  "wake up",
  "open your eyes",
  "share this before",
  "before they delete",
  "they don't want you to know",
  "they don't want you to see",
  "spread the truth",
  "the truth they hide",
  "what they don't tell you",
  "what they won't tell you",
  "repost", "retweet", "share if you agree",
  // Challenge templates (engagement bait)
  "change my mind", "prove me wrong", "i'll wait",
  "fight me", "come at me", "debate me",
  "i said what i said", "did i stutter",
  // Hot take openers
  "unpopular opinion", "hot take", "controversial opinion",
  "hear me out", "not sorry", "i don't care who this offends",
  // Dunk culture / ratio bait
  "ratio", "L take", "W take", "stay mad", "cry about it",
  "die mad about it", "cope harder", "cope and seethe",
  "nobody asked", "didn't ask", "who asked",
  // Blocking/ultimatum bait
  "block me", "unfollow me", "don't follow me if",
  "unfriend me if", "delete me if",
];

export const SECOND_PERSON_PROVOCATION = [
  "you people", "people like you",
  "if you support", "if you believe",
  "if you think", "if you still",
  "anyone who", "everyone who",
  "how can you", "how dare you",
  "you're part of the problem",
  "you're the reason",
  "your children", "your kids", "our children", "our kids",
  "fight back", "stand up", "take action",
  "must fight", "must act", "must stand",
  "we must", "we need to", "we have to",
  // Dismissive challenges directed at reader
  "you clearly", "you obviously",
  "if you disagree", "if you don't like it",
  "you can't even", "you don't even",
];

// ============================================
// MODIFIER LEXICONS
// ============================================

// Reporting/Analysis Discount signals
export const ATTRIBUTION_VERBS = [
  "said", "says", "stated", "states", "claimed", "claims",
  "according to", "reported", "reports", "noted", "notes",
  "argued", "argues", "suggested", "suggests", "indicated",
  "announced", "acknowledged", "confirmed", "denied",
  "explained", "described", "commented", "remarked",
];

export const HEDGING_TERMS = [
  "appears", "appears to", "seems", "seems to",
  "suggests", "may", "might", "could", "possibly",
  "perhaps", "arguably", "potentially", "likely",
  "allegedly", "reportedly", "supposedly", "purportedly",
  "it seems", "it appears", "evidence suggests",
];

export const MULTI_PERSPECTIVE_MARKERS = [
  "however", "on the other hand", "conversely",
  "critics say", "critics argue", "supporters say",
  "opponents argue", "proponents claim",
  "some argue", "others say", "while others",
  "both sides", "different perspectives",
  "according to critics", "according to supporters",
];

// ============================================
// CONTEMPT LEXICONS
// ============================================

export const CONTEMPT_TERMS = [
  "pathetic", "laughable", "ridiculous", "absurd", "clueless",
  "delusional", "imagine thinking", "these people", "so-called",
  "pretend", "pretending", "joke", "clown", "clowns", "unserious",
  "beneath", "not worth", "waste of time",
  // Dismissiveness
  "just lazy", "just stupid", "just ignorant", "just dumb",
  "imagine being", "must be nice to",
  "tell me you've never", "clearly never",
  "touch grass", "go outside", "get a life",
  "embarrassing", "cringe", "brain rot", "brain dead",
];

export const CONTEMPT_PATTERNS = [
  /\b(?:imagine|imagine actually)\b.*\b(?:believing|thinking|being)\b/i,
  /\b(?:how|why) (?:do|would|could) (?:anyone|they)\b/i,
  /\b(?:nobody|no one) (?:with|who has) (?:a brain|any sense|half)\b/i,
  /\bis just (?:lazy|stupid|ignorant|dumb|incompetent)\b/i,
  /\byou're not (?:actually|really)\b.*\byou're\b/i,
  /\bpretending to (?:be|care|work|know)\b/i,
];

// ============================================
// POLITICAL DISGUST LEXICONS
// ============================================

export const POLITICAL_DISGUST = [
  "sickening", "nauseating", "stomach-turning", "makes you sick",
  "stench", "reeks", "festering", "putrid", "cesspool",
  "repugnant", "vomit-inducing", "bile",
];

// ============================================
// SCHADENFREUDE LEXICONS
// ============================================

export const SCHADENFREUDE_PATTERNS = [
  /\b(?:love to see|you love to see|good riddance)\b/i,
  /\b(?:get what (?:they|you) deserve)\b/i,
  /\b(?:karma|comeuppance|poetic justice)\b/i,
  /\b(?:crying|tears|meltdown|cope|seethe)\b/i,
  /\b(?:how does it feel|taste of (?:their|your) own)\b/i,
];

// ============================================
// EPISTEMIC ARROGANCE LEXICONS
// ============================================

export const EPISTEMIC_ARROGANCE = [
  "everyone knows", "any reasonable person", "no serious person",
  "settled science", "not up for debate", "end of story",
  "period", "full stop", "wake up", "open your eyes",
  "do your research", "educate yourself",
];

// ============================================
// CYNICISM LEXICONS
// ============================================

export const CYNICISM_TERMS = [
  "rigged", "sham", "theater", "puppet", "kabuki",
  "smoke and mirrors", "facade", "charade", "circus",
  "broken beyond repair", "both sides are the same",
  "voting doesn't matter", "nothing will change",
];

// ============================================
// EXISTENTIAL THREAT LEXICONS
// ============================================

export const EXISTENTIAL_THREAT_PATTERNS = [
  /\b(?:end of|death of|destruction of) (?:democracy|freedom|america|the republic)\b/i,
  /\b(?:existential|civilizational|generational) (?:threat|crisis|emergency)\b/i,
  /\b(?:point of no return|last chance|now or never)\b/i,
  /\bif we don't (?:act|stop)\b.*\b(?:everything|it's over|too late)\b/i,
];

// Information Density signals are computed, not lexicon-based
