// Manages local "Reinforcement Learning" based on user feedback

const STORAGE_KEY_LEARNING = 'colorsplash_learning_data';

export type FeedbackType = 'complex' | 'distorted' | 'scary' | 'boring' | 'unwanted_object';

interface CategoryProfile {
  simplifyLevel: number; // 0-3
  qualityBoost: number;  // 0-3
  cutenessBoost: number; // 0-3
  excitementBoost: number; // 0-3
  objectPenalty: number; // 0-3
}

type LearningData = Record<string, CategoryProfile>; // Key is categoryId (e.g., 'animals')

const DEFAULT_PROFILE: CategoryProfile = {
  simplifyLevel: 0,
  qualityBoost: 0,
  cutenessBoost: 0,
  excitementBoost: 0,
  objectPenalty: 0
};

// SAFE KEYWORD BANKS
// Constrained list of modifiers to ensure safety and prevent "hallucinations".
// We move up/down these lists based on user feedback.
const CONSTRAINT_BANKS = {
  SIMPLIFY: [
    "", // Level 0
    "use thick outlines and simple shapes", // Level 1
    "very simple, minimal details, bold thick lines, easy to color", // Level 2
    "preschool level, massive shapes, very thick lines, no small details" // Level 3
  ],
  QUALITY: [
    "",
    "ensure symmetry and clear features",
    "anatomically correct, high quality vector art, perfect proportions",
    "masterpiece, distinct features, professional illustration, perfect composition"
  ],
  CUTENESS: [
    "",
    "friendly appearance, rounded shapes",
    "kawaii style, big eyes, happy expression",
    "extremely cute, baby style, adorable, soft edges, smiling"
  ],
  EXCITEMENT: [
    "",
    "active pose",
    "dynamic motion, energetic composition",
    "exciting action pose, dramatic angle, dynamic movement"
  ],
  PENALTY: [
    "",
    "focus on the main subject",
    "single subject only, do not add background characters",
    "single isolated subject, strictly no extra objects, no background characters"
  ]
};

const MAX_LEVEL = 3;

export const getLearningData = (): LearningData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LEARNING);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const saveLearningData = (data: LearningData) => {
  localStorage.setItem(STORAGE_KEY_LEARNING, JSON.stringify(data));
};

// Positive Feedback: Decay intensity of filters (Heal)
// If the user saves an image, it implies the current settings are roughly correct, 
// so we can slowly relax strict constraints to allow more variety again.
export const recordSave = (categoryId: string) => {
  const data = getLearningData();
  
  if (!data[categoryId]) return; // No data means default profile, nothing to heal

  const profile = data[categoryId];
  const HEAL_CHANCE = 0.25; // 25% chance to reduce a penalty/boost on success

  // Helper to decay values towards 0
  const decay = (val: number) => {
    if (val > 0 && Math.random() < HEAL_CHANCE) {
      return val - 1;
    }
    return val;
  };

  profile.simplifyLevel = decay(profile.simplifyLevel);
  profile.qualityBoost = decay(profile.qualityBoost);
  profile.cutenessBoost = decay(profile.cutenessBoost);
  profile.excitementBoost = decay(profile.excitementBoost);
  profile.objectPenalty = decay(profile.objectPenalty);

  saveLearningData(data);
};

// Negative Feedback: Increase intensity of specific constraints
export const recordFeedback = (categoryId: string, feedback: FeedbackType, weight: number = 1) => {
  const data = getLearningData();
  
  if (!data[categoryId]) {
    data[categoryId] = { ...DEFAULT_PROFILE };
  }

  const profile = data[categoryId];

  // Adjust weights based on feedback
  // We cap at MAX_LEVEL to ensure we stay within our pre-selected keyword banks.
  switch (feedback) {
    case 'complex':
      profile.simplifyLevel = Math.min(profile.simplifyLevel + weight, MAX_LEVEL);
      break;
    case 'distorted':
      profile.qualityBoost = Math.min(profile.qualityBoost + weight, MAX_LEVEL);
      break;
    case 'scary':
      profile.cutenessBoost = Math.min(profile.cutenessBoost + weight, MAX_LEVEL);
      break;
    case 'boring':
      profile.excitementBoost = Math.min(profile.excitementBoost + weight, MAX_LEVEL);
      break;
    case 'unwanted_object':
      profile.objectPenalty = Math.min(profile.objectPenalty + weight, MAX_LEVEL);
      break;
  }

  saveLearningData(data);
};

// Used by App.tsx to decide if "A [char] with [item]" prompts are allowed.
// If we have a penalty level > 0, we strictly block these combinations.
export const shouldIncludeExtraObjects = (categoryId: string): boolean => {
  const data = getLearningData();
  const profile = data[categoryId];
  if (!profile) return true; 
  return profile.objectPenalty === 0; 
};

// Returns a comma-separated string of safe modifiers
export const getPromptModifiers = (categoryId: string): string => {
  const data = getLearningData();
  const profile = data[categoryId];

  if (!profile) return "";

  const modifiers: string[] = [];

  if (profile.simplifyLevel > 0) modifiers.push(CONSTRAINT_BANKS.SIMPLIFY[profile.simplifyLevel]);
  if (profile.qualityBoost > 0) modifiers.push(CONSTRAINT_BANKS.QUALITY[profile.qualityBoost]);
  if (profile.cutenessBoost > 0) modifiers.push(CONSTRAINT_BANKS.CUTENESS[profile.cutenessBoost]);
  if (profile.excitementBoost > 0) modifiers.push(CONSTRAINT_BANKS.EXCITEMENT[profile.excitementBoost]);
  if (profile.objectPenalty > 0) modifiers.push(CONSTRAINT_BANKS.PENALTY[profile.objectPenalty]);

  return modifiers.join(", ");
};

export const getProfileStats = (categoryId: string): string => {
    const data = getLearningData();
    const p = data[categoryId];
    if (!p) return "No data";
    
    return `Simp:${p.simplifyLevel} Qual:${p.qualityBoost} Cute:${p.cutenessBoost} ObjPen:${p.objectPenalty}`;
};

// Returns a human-readable array of what the system has learned
// Displayed in the "Adult Mode" transparent view.
export const getLearningExplanation = (categoryId: string): string[] => {
    const data = getLearningData();
    const p = data[categoryId];
    if (!p) return ["System is using default settings."];

    const explanations: string[] = [];

    if (p.simplifyLevel > 0) explanations.push(`⚠️ Too Complex: forcing simplification (Level ${p.simplifyLevel}/3)`);
    if (p.qualityBoost > 0) explanations.push(`⚠️ Distortions: forcing anatomy/quality checks (Level ${p.qualityBoost}/3)`);
    if (p.cutenessBoost > 0) explanations.push(`⚠️ Scary: forcing cuteness/rounding (Level ${p.cutenessBoost}/3)`);
    if (p.excitementBoost > 0) explanations.push(`⚠️ Boring: forcing dynamic action (Level ${p.excitementBoost}/3)`);
    if (p.objectPenalty > 0) explanations.push(`⚠️ Cluttered: removing extras/backgrounds (Level ${p.objectPenalty}/3)`);

    if (explanations.length === 0) return ["System is using default settings."];
    return explanations;
};