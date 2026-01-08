import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './components/Button';
import { PixelGrid } from './components/PixelGrid';
import { ColorPalette } from './components/ColorPalette';
import { SetupScreen } from './components/SetupScreen';
import { Logo } from './components/Logo'; // Import Logo
import { GameState, PixelData } from './types';
import { generateConceptImage, getStoredApiKey, setStoredApiKey, clearStoredApiKey, GENERATION_MODEL_NAME, constructGenerationPrompt } from './services/gemini';
import { processImageForGame } from './services/imageProcessor';
import { recordFeedback, recordSave, getPromptModifiers, getProfileStats, shouldIncludeExtraObjects, getLearningExplanation, FeedbackType } from './services/learning';

// --- Constants & Data ---

const COOLDOWN_MS = 10000; // 10 seconds cooldown
const APP_VERSION = "v1.30";
const STORAGE_KEY_TRANSPARENT = 'colorsplash_transparent_mode';

const STYLES = [
  { id: 'cute', label: 'Cute', emoji: '🧸' },
  { id: 'anime', label: 'Anime', emoji: '✨' },
  { id: 'abstract', label: 'Abstract', emoji: '🎨' },
  { id: 'pixel', label: 'Pixel', emoji: '👾' },
  { id: 'cartoon', label: 'Cartoon', emoji: '📺' },
];

// Updated colors for vibrant vibrant look
const CATEGORIES = [
  {
    id: 'animals',
    label: 'Animals',
    emoji: '🦁',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    borderColor: 'border-orange-500',
    textColor: 'text-white',
    items: [
      { label: 'Lion', emoji: '🦁', prompt: 'lion' },
      { label: 'Dino', emoji: '🦕', prompt: 'dinosaur' },
      { label: 'Cat', emoji: '🐱', prompt: 'cat' },
      { label: 'Dog', emoji: '🐶', prompt: 'puppy' },
      { label: 'Butterfly', emoji: '🦋', prompt: 'butterfly' },
      { label: 'Turtle', emoji: '🐢', prompt: 'turtle' },
      { label: 'Bunny', emoji: '🐰', prompt: 'cute bunny rabbit' },
      { label: 'Bear', emoji: '🐻', prompt: 'teddy bear' },
      { label: 'Elephant', emoji: '🐘', prompt: 'baby elephant' },
      { label: 'Monkey', emoji: '🐒', prompt: 'playful monkey' },
      { label: 'Penguin', emoji: '🐧', prompt: 'cute penguin' },
      { label: 'Giraffe', emoji: '🦒', prompt: 'tall giraffe' },
    ]
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    emoji: '🦄',
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    borderColor: 'border-purple-500',
    textColor: 'text-white',
    items: [
      { label: 'Unicorn', emoji: '🦄', prompt: 'magical unicorn' },
      { label: 'Dragon', emoji: '🐉', prompt: 'friendly dragon' },
      { label: 'Fairy', emoji: '🧚', prompt: 'magical fairy' },
      { label: 'Mermaid', emoji: '🧜‍♀️', prompt: 'cute mermaid under water' },
      { label: 'Wizard', emoji: '🧙‍♂️', prompt: 'friendly wizard casting a spell' },
      { label: 'Castle', emoji: '🏰', prompt: 'fairy tale castle' },
      { label: 'Elf', emoji: '🧝', prompt: 'forest elf' },
      { label: 'Phoenix', emoji: '🔥', prompt: 'fire phoenix bird' },
      { label: 'Genie', emoji: '🧞', prompt: 'magical genie' },
    ]
  },
  {
    id: 'space',
    label: 'Space',
    emoji: '🚀',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    borderColor: 'border-indigo-500',
    textColor: 'text-white',
    items: [
      { label: 'Astronaut', emoji: '👨‍🚀', prompt: 'astronaut spaceman' },
      { label: 'Rocket', emoji: '🚀', prompt: 'space rocket ship' },
      { label: 'Alien', emoji: '👽', prompt: 'cute friendly alien' },
      { label: 'Planet', emoji: '🪐', prompt: 'saturn planet in space' },
      { label: 'Robot', emoji: '🤖', prompt: 'cool robot' },
      { label: 'UFO', emoji: '🛸', prompt: 'flying saucer spaceship' },
      { label: 'Moon', emoji: '🌙', prompt: 'crescent moon and stars' },
      { label: 'Earth', emoji: '🌍', prompt: 'planet earth from space' },
      { label: 'Star', emoji: '⭐', prompt: 'shining star' },
    ]
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    emoji: '🚗',
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-white',
    items: [
      { label: 'Race Car', emoji: '🏎️', prompt: 'race car' },
      { label: 'Police Car', emoji: '🚓', prompt: 'police car' },
      { label: 'Train', emoji: '🚂', prompt: 'steam train' },
      { label: 'Boat', emoji: '⛵', prompt: 'sailboat' },
      { label: 'Plane', emoji: '✈️', prompt: 'flying airplane' },
      { label: 'Truck', emoji: '🚚', prompt: 'delivery truck' },
      { label: 'Bus', emoji: '🚌', prompt: 'school bus' },
      { label: 'Helicopter', emoji: '🚁', prompt: 'helicopter' },
      { label: 'Tractor', emoji: '🚜', prompt: 'farm tractor' },
    ]
  },
  {
    id: 'food',
    label: 'Yummy',
    emoji: '🍦',
    bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
    borderColor: 'border-pink-500',
    textColor: 'text-white',
    items: [
      { label: 'Ice Cream', emoji: '🍦', prompt: 'ice cream cone' },
      { label: 'Pizza', emoji: '🍕', prompt: 'pizza slice' },
      { label: 'Cupcake', emoji: '🧁', prompt: 'cupcake' },
      { label: 'Fruit', emoji: '🍓', prompt: 'fruit basket' },
      { label: 'Burger', emoji: '🍔', prompt: 'cheeseburger' },
      { label: 'Donut', emoji: '🍩', prompt: 'donut' },
      { label: 'Cookie', emoji: '🍪', prompt: 'chocolate chip cookie' },
      { label: 'Taco', emoji: '🌮', prompt: 'taco' },
      { label: 'Sushi', emoji: '🍣', prompt: 'sushi roll' },
    ]
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
    borderColor: 'border-green-500',
    textColor: 'text-white',
    items: [
      { label: 'Soccer', emoji: '⚽', prompt: 'soccer ball' },
      { label: 'Basketball', emoji: '🏀', prompt: 'basketball' },
      { label: 'Tennis', emoji: '🎾', prompt: 'tennis racket and ball' },
      { label: 'Baseball', emoji: '⚾', prompt: 'baseball bat and ball' },
      { label: 'Football', emoji: '🏈', prompt: 'american football' },
      { label: 'Volleyball', emoji: '🏐', prompt: 'volleyball' },
      { label: 'Golf', emoji: '⛳', prompt: 'golf club and ball' },
      { label: 'Hockey', emoji: '🏒', prompt: 'ice hockey stick and puck' },
      { label: 'Skating', emoji: '🛹', prompt: 'skateboard' },
    ]
  },
  {
    id: 'nature',
    label: 'Nature',
    emoji: '🏔️',
    bgColor: 'bg-gradient-to-br from-teal-400 to-teal-600',
    borderColor: 'border-teal-500',
    textColor: 'text-white',
    items: [
      { label: 'Beach', emoji: '🏖️', prompt: 'sunny beach with palm trees' },
      { label: 'Mountain', emoji: '🏔️', prompt: 'snowy mountain peak' },
      { label: 'Forest', emoji: '🌲', prompt: 'path in a green forest' },
      { label: 'Desert', emoji: '🌵', prompt: 'desert landscape with cactus' },
      { label: 'Rainbow', emoji: '🌈', prompt: 'bright rainbow over hills' },
      { label: 'Flowers', emoji: '🌻', prompt: 'field of sunflowers' },
      { label: 'Tree', emoji: '🌳', prompt: 'big oak tree' },
      { label: 'Sun', emoji: '☀️', prompt: 'smiling sun in the sky' },
      { label: 'Snowman', emoji: '⛄', prompt: 'snowman in winter' },
    ]
  }
];

const EXCLAMATIONS: Record<string, string[]> = {
  animals: ["Wild!", "Roar!", "Cute!", "Adorable!"],
  vehicles: ["Zoom!", "Vroom!", "Fast!", "Speedy!"],
  fantasy: ["Magical!", "Sparkly!", "Amazing!", "Mystical!"],
  space: ["Cosmic!", "Blast off!", "Stellar!", "Far out!"],
  food: ["Yummy!", "Delicious!", "Tasty!", "Sweet!"],
  sports: ["Score!", "Goal!", "Exciting!", "Victory!"],
  nature: ["Scenic!", "Beautiful!", "Fresh!", "Inspiring!"],
  default: ["Wow!", "Beautiful!", "Super!", "Nice!"]
};

// --- Dynamic Prompt Logic ---

const CHARACTERS = [
  "cute puppy", "happy kitten", "friendly bear", "little boy", "little girl", 
  "baby dragon", "tiny robot", "cheerful bunny", "playful monkey", "baby dinosaur",
  "friendly tiger", "cute elephant"
];

const generateSmartPrompt = (categoryId: string, label: string, basePrompt: string) => {
  const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  
  // Define which selections are already characters, so we don't say "A puppy robot" if the user picked "Robot"
  const characterLabels = ['Unicorn', 'Dragon', 'Robot', 'Alien', 'Fairy', 'Wizard', 'Mermaid', 'Astronaut', 'Elf', 'Genie', 'Phoenix', 'Snowman'];
  const isCharacterSelection = categoryId === 'animals' || characterLabels.includes(label);

  // Check if we should add extra objects based on learning profile
  const allowExtras = shouldIncludeExtraObjects(categoryId);

  // 50% chance to add character to non-character categories, IF allowed by learning
  if (allowExtras && !isCharacterSelection && Math.random() > 0.5) {
     if (categoryId === 'vehicles') return `A ${char} riding in a ${basePrompt}`;
     if (categoryId === 'food') return `A ${char} eating a delicious ${basePrompt}`;
     if (categoryId === 'nature') return `A ${char} exploring a ${basePrompt}`;
     if (categoryId === 'space') return `A ${char} exploring a ${basePrompt}`;
     if (categoryId === 'sports') return `A ${char} playing with a ${basePrompt}`;
     if (categoryId === 'fantasy' && label === 'Castle') return `A ${char} visiting a ${basePrompt}`;
     if (label === 'Castle') return `A ${char} visiting a ${basePrompt}`;
     
     // Default interaction if not caught by specific categories above
     return `A ${char} with a ${basePrompt}`;
  }

  // Pure Object / Default logic
  const first = basePrompt.toLowerCase().charAt(0);
  const article = ['a','e','i','o','u'].includes(first) ? 'An' : 'A';
  return `${article} ${basePrompt}`;
};

// Initial state constant
const INITIAL_STATE: GameState = {
  stage: 'input',
  prompt: '',
  style: 'cute',
  difficulty: 'medium', // Default brush size
  originalImage: null,
  gridSize: 32,
  colorCount: 10,
  grid: [],
  palette: [],
  activeColorIndex: 0,
  unlockedColorIndex: 0,
  completedPixels: 0,
  totalPixels: 0,
};

interface SavedGame extends Omit<GameState, 'stage' | 'originalImage'> {
  id: string;
  timestamp: number;
}

type HistoryState = Pick<GameState, 'grid' | 'activeColorIndex' | 'unlockedColorIndex' | 'completedPixels'>;

const STORAGE_KEY = 'colorsplash_saves';

const App: React.FC = () => {
  // Auth State
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Game State
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [adultMode, setAdultMode] = useState(false); // New Adult/Transparent Mode
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  });

  const [loading, setLoading] = useState(false); // Global loading (full screen overlay)
  const [isSaving, setIsSaving] = useState(false); // Local saving (button only)
  const [error, setError] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [hintPixelIndex, setHintPixelIndex] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // State for visual timer
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  
  // Animation States
  const [saveAnim, setSaveAnim] = useState<{x: number, y: number} | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Modal States
  const [showDiscardFeedback, setShowDiscardFeedback] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Check for API Key on mount
  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setHasKey(true);
    } else {
      setHasKey(false);
    }
    setCheckingKey(false);
  }, []);

  // Check for Transparent Mode on mount
  useEffect(() => {
    const storedMode = localStorage.getItem(STORAGE_KEY_TRANSPARENT);
    if (storedMode === 'true') {
        setAdultMode(true);
    }
  }, []);

  const toggleAdultMode = () => {
    const newValue = !adultMode;
    setAdultMode(newValue);
    localStorage.setItem(STORAGE_KEY_TRANSPARENT, String(newValue));
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedGames(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Clear justSaved after animation
  useEffect(() => {
    if (justSaved) {
        const timer = setTimeout(() => setJustSaved(false), 2000);
        return () => clearTimeout(timer);
    }
  }, [justSaved]);

  // Timer Effect for Cooldown
  useEffect(() => {
    const checkTimer = () => {
        const now = Date.now();
        if (cooldownUntil > now) {
            setTimeLeft(Math.ceil((cooldownUntil - now) / 1000));
        } else {
            setTimeLeft(0);
        }
    };
    
    // Check immediately
    checkTimer();
    
    const interval = setInterval(checkTimer, 200);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'h') {
        handleHint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, gameState]);

  // Memoize success title to prevent changes on re-renders, updates when image changes
  const successTitle = useMemo(() => {
    const key = selectedCategory && EXCLAMATIONS[selectedCategory] ? selectedCategory : 'default';
    const list = EXCLAMATIONS[key];
    return list[Math.floor(Math.random() * list.length)];
  }, [gameState.originalImage, selectedCategory]);

  const handleSaveKey = (key: string, transparencyMode: boolean) => {
    setStoredApiKey(key);
    setAdultMode(transparencyMode);
    localStorage.setItem(STORAGE_KEY_TRANSPARENT, String(transparencyMode));
    setHasKey(true);
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setHasKey(false);
  };

  const saveGame = () => {
    if (!gameState.id) return;
    const gameToSave: SavedGame = {
      id: gameState.id,
      timestamp: Date.now(),
      prompt: gameState.prompt,
      style: gameState.style,
      difficulty: gameState.difficulty,
      gridSize: gameState.gridSize,
      colorCount: gameState.colorCount,
      grid: gameState.grid,
      palette: gameState.palette,
      activeColorIndex: gameState.activeColorIndex,
      unlockedColorIndex: gameState.unlockedColorIndex,
      completedPixels: gameState.completedPixels,
      totalPixels: gameState.totalPixels
    };
    const newSavedGames = [gameToSave, ...savedGames.filter(g => g.id !== gameToSave.id)];
    newSavedGames.sort((a, b) => b.timestamp - a.timestamp);
    setSavedGames(newSavedGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedGames));
    
    // Positive Reinforcement: If we are in a category, a save is a good sign
    if (selectedCategory) {
        recordSave(selectedCategory);
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const loadGame = (save: SavedGame) => {
    setGameState({
      ...INITIAL_STATE, // Use defaults for new fields (like difficulty) if missing in old saves
      ...save,
      stage: save.completedPixels === save.totalPixels ? 'complete' : 'playing',
      originalImage: null
    });
    setPast([]);
    setFuture([]);
    setSelectedCategory(null);
    setShowGallery(false);
  };

  const deleteSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSavedGames = savedGames.filter(g => g.id !== id);
    setSavedGames(newSavedGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedGames));
  };

  const handleSelectCategory = (id: string | null) => {
    setGameState(prev => ({ ...prev, prompt: '' }));
    setSelectedCategory(id);
  };

  const handleStart = async (promptOverride?: string) => {
    const now = Date.now();
    if (now < cooldownUntil) {
        // Visuals handled by the timeLeft effect, but backup check here
        return;
    }
    const basePrompt = promptOverride || gameState.prompt;
    if (!basePrompt.trim()) return;
    
    // Get Learning Modifiers
    const modifiers = selectedCategory ? getPromptModifiers(selectedCategory) : undefined;
    
    setGameState(prev => ({ ...prev, prompt: basePrompt, originalImage: null }));
    setCooldownUntil(now + COOLDOWN_MS);
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateConceptImage(basePrompt, gameState.style, modifiers);
      setGameState(prev => ({ 
        ...prev, 
        stage: 'preview', 
        originalImage: result.imageUrl,
        generationStats: result.stats
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGame = async () => {
    if (!gameState.originalImage) return;
    setLoading(true);
    setGameState(prev => ({ ...prev, stage: 'processing' }));
    setTimeout(async () => {
        try {
          const { grid, palette } = await processImageForGame(
            gameState.originalImage!, 
            gameState.gridSize, 
            gameState.colorCount
          );
          setGameState(prev => ({
            ...prev,
            id: Date.now().toString(),
            stage: 'playing',
            grid,
            palette,
            totalPixels: grid.length,
            completedPixels: 0,
            activeColorIndex: 0,
            unlockedColorIndex: palette.length - 1,
          }));
          setPast([]);
          setFuture([]);
        } catch (e) {
          setError("Error creating your puzzle.");
          setGameState(prev => ({ ...prev, stage: 'preview' }));
        } finally {
          setLoading(false);
        }
      }, 100);
  };

  const handleSaveToGallery = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gameState.originalImage) return;
    
    // 1. Trigger Visual Feedback (Floating Icon)
    const btn = e.currentTarget as HTMLButtonElement;
    const rect = btn.getBoundingClientRect();
    setSaveAnim({ x: rect.left + rect.width / 2, y: rect.top });
    
    // 2. Start Loading (Local button only)
    setIsSaving(true);
    
    try {
        // Generate grid now so it's ready for later
        const { grid, palette } = await processImageForGame(
            gameState.originalImage, 
            gameState.gridSize, 
            gameState.colorCount
        );

        const newSave: SavedGame = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            prompt: gameState.prompt,
            style: gameState.style,
            difficulty: gameState.difficulty,
            gridSize: gameState.gridSize,
            colorCount: gameState.colorCount,
            grid,
            palette,
            activeColorIndex: 0,
            unlockedColorIndex: palette.length - 1,
            completedPixels: 0,
            totalPixels: grid.length
        };

        const newSavedGames = [newSave, ...savedGames];
        // Sort newest first
        newSavedGames.sort((a, b) => b.timestamp - a.timestamp);
        
        setSavedGames(newSavedGames);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedGames));
        
        // Positive Reinforcement
        if (selectedCategory) {
            recordSave(selectedCategory);
        }
        
        // 3. Flag for Gallery Pop on return
        setJustSaved(true);
        
        // Go back to start
        resetGame();

    } catch (e) {
        setError("Could not save to gallery. Try starting the game instead.");
    } finally {
        setIsSaving(false);
        // Clear animation after it finishes playing
        setTimeout(() => setSaveAnim(null), 1000);
    }
  };

  const handleSaveAndHome = () => {
      saveGame();
      setTimeout(() => resetGame(), 1500);
  };

  const handleRestartPuzzle = () => {
      setGameState(prev => {
          // Reset grid progress
          const newGrid = prev.grid.map(p => ({ ...p, isColored: false }));
          return {
              ...prev,
              grid: newGrid,
              completedPixels: 0,
              activeColorIndex: 0,
              stage: 'playing'
          };
      });
      setPast([]);
      setFuture([]);
      setShowRestartConfirm(false);
  };

  const handleDiscardClick = () => {
    // Show feedback modal for everyone now, but style it differently based on mode
    if (selectedCategory) {
        setShowDiscardFeedback(true);
    } else {
        // If random prompt (no category), just go back
        setGameState(prev => ({ ...prev, stage: 'input' }));
    }
  };

  const handleFeedbackSubmit = (feedback: FeedbackType) => {
    if (selectedCategory) {
        // If in adult/transparent mode, apply stronger weight (Parental Grounding)
        const weight = adultMode ? 2 : 1;
        recordFeedback(selectedCategory, feedback, weight);
    }
    setShowDiscardFeedback(false);
    setGameState(prev => ({ ...prev, stage: 'input' }));
  };

  const handleFeedbackCancel = () => {
    setShowDiscardFeedback(false);
    setGameState(prev => ({ ...prev, stage: 'input' }));
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture([{ grid: gameState.grid, activeColorIndex: gameState.activeColorIndex, unlockedColorIndex: gameState.unlockedColorIndex, completedPixels: gameState.completedPixels }, ...future]);
    setPast(newPast);
    setGameState(prev => ({ ...prev, ...previous }));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast([...past, { grid: gameState.grid, activeColorIndex: gameState.activeColorIndex, unlockedColorIndex: gameState.unlockedColorIndex, completedPixels: gameState.completedPixels }]);
    setFuture(newFuture);
    setGameState(prev => ({ ...prev, ...next }));
  };

  const handleHint = () => {
    if (gameState.stage !== 'playing') return;
    const candidates = gameState.grid
      .map((p, i) => ({ ...p, index: i }))
      .filter(p => p.colorIndex === gameState.activeColorIndex && !p.isColored);
    if (candidates.length === 0) return;
    const randomPixel = candidates[Math.floor(Math.random() * candidates.length)];
    setHintPixelIndex(randomPixel.index);
    setTimeout(() => setHintPixelIndex(null), 3000);
  };

  const handlePaintPixels = useCallback((indices: number[]) => {
    const currentState = gameStateRef.current;
    if (currentState.stage !== 'playing') return;

    // Filter for valid moves to see if we need to save history
    const validMoves = indices.filter(i => {
        const p = currentState.grid[i];
        return p && !p.isColored && p.colorIndex === currentState.activeColorIndex;
    });

    if (validMoves.length === 0) return;

    setHintPixelIndex(null);
    
    // Save history state
    setPast(prev => [...prev, { 
        grid: currentState.grid, 
        activeColorIndex: currentState.activeColorIndex, 
        unlockedColorIndex: currentState.unlockedColorIndex, 
        completedPixels: currentState.completedPixels 
    }]);
    setFuture([]);

    // Apply updates
    setGameState(prev => {
        const newGrid = [...prev.grid];
        let added = 0;
        
        validMoves.forEach(i => {
            // Re-check in case multiple events fired (paranoia, but good)
            if (!newGrid[i].isColored && newGrid[i].colorIndex === prev.activeColorIndex) {
                newGrid[i] = { ...newGrid[i], isColored: true };
                added++;
            }
        });

        if (added === 0) return prev;

        const newCompleted = prev.completedPixels + added;
        
        // Smart Cycle Logic: Find the next incomplete color (wrapping around)
        // 1. Is the current color finished?
        const isCurrentColorFinished = !newGrid.some(p => p.colorIndex === prev.activeColorIndex && !p.isColored);
        
        let newActive = prev.activeColorIndex;

        if (isCurrentColorFinished && newCompleted < prev.totalPixels) {
            // Find next incomplete color starting from next index
            let nextIndex = -1;
            
            // Look forward
            for (let i = prev.activeColorIndex + 1; i < prev.palette.length; i++) {
                if (newGrid.some(p => p.colorIndex === i && !p.isColored)) {
                    nextIndex = i;
                    break;
                }
            }

            // If not found, wrap around and look from 0 up to current
            if (nextIndex === -1) {
                for (let i = 0; i < prev.activeColorIndex; i++) {
                     if (newGrid.some(p => p.colorIndex === i && !p.isColored)) {
                        nextIndex = i;
                        break;
                    }
                }
            }

            if (nextIndex !== -1) {
                newActive = nextIndex;
            }
        }

        return {
            ...prev,
            grid: newGrid,
            completedPixels: newCompleted,
            activeColorIndex: newActive,
            stage: newCompleted === prev.totalPixels ? 'complete' : 'playing'
        };
    });
  }, []);

  const resetGame = () => { 
    setGameState(prev => ({ 
        ...INITIAL_STATE,
        // Preserve user preferences for next game
        style: prev.style,
        difficulty: prev.difficulty,
        gridSize: prev.gridSize,
        colorCount: prev.colorCount 
    })); 
    setPast([]); 
    setFuture([]); 
    setSelectedCategory(null); 
    setShowGallery(false); 
  };

  if (checkingKey) {
    return <div className="min-h-screen bg-indigo-50 flex items-center justify-center text-indigo-300">Loading Magic...</div>;
  }

  if (!hasKey) {
    return <SetupScreen 
      onSave={handleSaveKey} 
    />;
  }

  if (gameState.stage === 'preview') {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6 relative">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 text-center z-10">
           <h2 className="text-3xl font-black text-indigo-600 mb-2">{successTitle}</h2>
           <div className="aspect-square w-full bg-white rounded-xl shadow-inner border-4 border-slate-100 mb-4 overflow-hidden relative group">
             {gameState.originalImage && <img src={gameState.originalImage} className="w-full h-full object-contain p-2" />}
             {/* Stats Overlay in Preview (Adult Mode) */}
             {adultMode && gameState.generationStats && (
                <div className="absolute bottom-0 left-0 w-full bg-slate-900/90 text-left p-3 backdrop-blur-sm animate-slide-up max-h-[50%] overflow-y-auto custom-scrollbar rounded-b-xl border-t border-slate-700">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <span className="text-[10px] font-mono text-green-400 font-bold tracking-wider">GENERATION STATS</span>
                        <span className="text-[9px] font-mono text-yellow-300 bg-yellow-900/30 px-1 rounded">{gameState.generationStats.model}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-300 font-mono mb-3">
                         <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Input Tokens</span>
                            <span className="text-white font-bold">{gameState.generationStats.inputTokens || 0}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Output Tokens</span>
                            <span className="text-white font-bold">{gameState.generationStats.outputTokens || 'N/A'}</span>
                         </div>
                         <div className="flex flex-col col-span-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-[8px] uppercase">Total Consumption</span>
                                <span className="text-white font-bold">{gameState.generationStats.totalTokens || 0}</span>
                            </div>
                         </div>
                    </div>
                    
                    {/* Adaptive Learning Logic Section */}
                    {selectedCategory && (
                        <div className="border-t border-slate-700 pt-3 mt-1">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono text-purple-400 font-bold tracking-wider">ADAPTIVE LOGIC</span>
                                <span className="bg-purple-900/50 text-purple-200 border border-purple-700/50 px-1.5 py-0.5 rounded text-[8px] font-mono">{getProfileStats(selectedCategory)}</span>
                             </div>
                             <div className="text-[9px] text-slate-400 font-mono space-y-1.5 pl-1">
                                {getLearningExplanation(selectedCategory).map((explanation, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-purple-500 mt-0.5">↳</span>
                                        <span className="leading-tight">{explanation}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
             )}
           </div>
           
           <div className="flex flex-col gap-3">
             <Button onClick={handleConfirmGame} variant="primary" className="w-full py-4 text-xl shadow-lg" isLoading={loading}>Start Coloring! 🎨</Button>
             <div className="flex gap-3">
                 <Button onClick={handleSaveToGallery} variant="secondary" className="flex-1 py-3 text-sm" isLoading={isSaving}>Save for Later 💾</Button>
                 <Button onClick={handleDiscardClick} variant="danger" className="flex-1 py-3 text-sm">Discard ❌</Button>
             </div>
           </div>
        </div>

        {/* Feedback Modal (Dynamic based on AdultMode) */}
        {showDiscardFeedback && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className={`
                    ${adultMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-white text-slate-800'}
                    border-2 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up transition-colors
                `}>
                    {adultMode ? (
                        /* ADULT / TRANSPARENT MODE UI */
                        <>
                             <h3 className="text-green-400 font-mono font-bold text-lg mb-2 flex items-center gap-2">
                                <span>📊</span> GROUND TRUTH
                            </h3>
                            <p className="text-slate-400 text-xs font-mono mb-4">
                                <strong>Parental Override:</strong> Feedback given in Transparent Mode carries <span className="text-green-400">double weight</span>.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <button 
                                    onClick={() => handleFeedbackSubmit('complex')}
                                    className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono text-white flex justify-between"
                                >
                                    <span>Too Complex</span>
                                    <span className="text-slate-500">Simplify++</span>
                                </button>
                                <button 
                                     onClick={() => handleFeedbackSubmit('distorted')}
                                     className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono text-white flex justify-between"
                                >
                                    <span>Distorted / Glitchy</span>
                                    <span className="text-slate-500">Quality++</span>
                                </button>
                                <button 
                                     onClick={() => handleFeedbackSubmit('scary')}
                                     className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono text-white flex justify-between"
                                >
                                    <span>Scary / Not Cute</span>
                                    <span className="text-slate-500">Cuter++</span>
                                </button>
                                <button 
                                     onClick={() => handleFeedbackSubmit('boring')}
                                     className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono text-white flex justify-between"
                                >
                                    <span>Boring / Empty</span>
                                    <span className="text-slate-500">Dynamic++</span>
                                </button>
                                <button 
                                     onClick={() => handleFeedbackSubmit('unwanted_object')}
                                     className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono text-white flex justify-between"
                                >
                                    <span>Extra Object</span>
                                    <span className="text-slate-500">Penalty++</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        /* KID / NORMAL MODE UI */
                        <>
                            <h3 className="text-2xl font-black text-center mb-1">Oh no! 🙈</h3>
                            <p className="text-center text-slate-500 font-bold mb-6">What was wrong with this picture?</p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button 
                                    onClick={() => handleFeedbackSubmit('complex')}
                                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <span className="text-4xl">🧩</span>
                                    <span className="font-bold text-indigo-600 text-sm">Too Hard</span>
                                </button>
                                <button 
                                    onClick={() => handleFeedbackSubmit('scary')}
                                    className="bg-pink-50 hover:bg-pink-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <span className="text-4xl">👻</span>
                                    <span className="font-bold text-pink-600 text-sm">Scary</span>
                                </button>
                                <button 
                                    onClick={() => handleFeedbackSubmit('boring')}
                                    className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <span className="text-4xl">🥱</span>
                                    <span className="font-bold text-yellow-600 text-sm">Boring</span>
                                </button>
                                <button 
                                    onClick={() => handleFeedbackSubmit('distorted')}
                                    className="bg-red-50 hover:bg-red-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <span className="text-4xl">🥴</span>
                                    <span className="font-bold text-red-600 text-sm">Looked Weird</span>
                                </button>
                            </div>
                        </>
                    )}

                    <button 
                        onClick={handleFeedbackCancel}
                        className={`w-full py-3 text-center font-bold text-sm ${adultMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-indigo-500'}`}
                    >
                        Skip
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- Render Helpers ---

  const HexButton = ({ category, onClick, className = '' }: any) => {
    // Bubbly Rounded Hexagon Mask
    const maskImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 115' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 8 Q50 0 60 8 L90 23 Q100 28 100 40 L100 75 Q100 87 90 92 L60 107 Q50 115 40 107 L10 92 Q0 87 0 75 L0 40 Q0 28 10 23 Z' fill='black'/%3E%3C/svg%3E")`;

    return (
      <button
        onClick={onClick}
        disabled={timeLeft > 0}
        className={`
          relative w-32 h-36 sm:w-40 sm:h-44 flex-shrink-0 
          transition-transform duration-300 hover:scale-110 active:scale-95 z-10
          hover:z-20 group
          disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none
          ${className}
        `}
        style={{
          marginBottom: '-2rem', // Negative margin for stacking
          marginLeft: '0.5rem',
          marginRight: '0.5rem'
        }}
      >
        <div 
           className={`w-full h-full filter drop-shadow-xl transition-all duration-300 group-hover:drop-shadow-2xl`}
        >
            <div
                className={`w-full h-full ${category.bgColor} flex flex-col items-center justify-center ${category.textColor} relative overflow-hidden`}
                style={{
                    maskImage,
                    WebkitMaskImage: maskImage,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat'
                }}
            >
                {/* Glossy Highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)]" />
                
                <span className="text-6xl sm:text-7xl mb-1 filter drop-shadow-sm transform group-hover:rotate-6 transition-transform">{category.emoji}</span>
                <span className="font-black text-xs sm:text-sm uppercase tracking-wide drop-shadow-md">{category.label}</span>
            </div>
        </div>
      </button>
    );
  };

  const renderCategoryHexGrid = () => {
    // Mapping: Center = Animals (0), surrounded by others
    // Top Row: Fantasy(1), Space(2)
    // Middle Row: Nature(6), Animals(0), Vehicles(3)
    // Bottom Row: Sports(5), Food(4)
    
    // Safety check in case CATEGORIES changes
    if (CATEGORIES.length < 7) return <div>Config Error</div>;

    const c = CATEGORIES; // Alias

    return (
      <div className="flex flex-col items-center justify-center py-6 animate-fade-in-up">
        {/* Top Row */}
        <div className="flex justify-center -mb-6 z-0">
           <HexButton category={c[1]} onClick={() => handleSelectCategory(c[1].id)} />
           <HexButton category={c[2]} onClick={() => handleSelectCategory(c[2].id)} />
        </div>
        
        {/* Middle Row */}
        <div className="flex justify-center -mb-6 z-10">
           <HexButton category={c[6]} onClick={() => handleSelectCategory(c[6].id)} />
           <HexButton category={c[0]} onClick={() => handleSelectCategory(c[0].id)} className="z-30 scale-110 hover:scale-125" />
           <HexButton category={c[3]} onClick={() => handleSelectCategory(c[3].id)} />
        </div>

        {/* Bottom Row */}
        <div className="flex justify-center z-0">
           <HexButton category={c[5]} onClick={() => handleSelectCategory(c[5].id)} />
           <HexButton category={c[4]} onClick={() => handleSelectCategory(c[4].id)} />
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mt-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
        <span className="text-2xl">⚙️</span>
        <h3 className="font-bold text-slate-700 text-lg">Game Setup</h3>
      </div>
      
      {/* Art Style Selection */}
      <div className="mb-8">
        <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Art Style</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => setGameState(s => ({ ...s, style: style.id }))}
              className={`
                group relative flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-200 ease-out
                ${gameState.style === style.id 
                  ? 'bg-white border-indigo-500 shadow-lg ring-2 ring-indigo-100 -translate-y-1 z-10' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:bg-slate-50 hover:-translate-y-0.5'}
              `}
            >
              <span className="text-5xl mb-2 filter drop-shadow-sm transform transition-transform group-hover:scale-110 leading-normal">{style.emoji}</span>
              <span className={`text-[10px] font-black uppercase tracking-wide transition-colors ${gameState.style === style.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                {style.label}
              </span>
              {gameState.style === style.id && (
                 <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-bounce-small">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                 </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Canvas Size (Previously Grid Size) */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Canvas Size</label>
        <div className="flex justify-between gap-2 mt-1 bg-white p-1 rounded-xl border-2 border-slate-100">
          {[16, 32, 64, 128].map(size => {
            let label = 'Small';
            if (size === 32) label = 'Med';
            if (size === 64) label = 'Big';
            if (size === 128) label = 'Huge';
            return (
                <button
                key={size}
                onClick={() => setGameState(s => ({ ...s, gridSize: size }))}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                    gameState.gridSize === size 
                    ? 'bg-indigo-100 text-indigo-600 shadow-sm ring-1 ring-indigo-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500'
                }`}
                >
                {label} <span className="block text-[8px] font-normal opacity-70">{size}x{size}</span>
                </button>
            );
          })}
        </div>
      </div>

      {/* Color Count */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Complexity (Colors)</label>
            <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{gameState.colorCount} Colors</span>
        </div>
        <div className="px-1">
          <input 
            type="range" 
            min="4" 
            max="32" 
            step="1"
            value={gameState.colorCount}
            onChange={(e) => setGameState(s => ({ ...s, colorCount: parseInt(e.target.value) }))}
            className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer hover:bg-slate-300 transition-colors"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 px-1">
            <span>Simple (4)</span>
            <span>Complex (32)</span>
        </div>
      </div>

      {/* Adult Mode Toggle (Updated to standard checkbox) */}
      <div className="mb-6 flex items-center justify-between bg-white p-3 rounded-xl border-2 border-slate-100">
        <div className="flex flex-col">
            <span className="font-bold text-slate-700 text-sm">Transparent Mode</span>
            <span className="text-[10px] text-slate-400">Show exact AI prompt, tokens & limits</span>
        </div>
        <input 
            type="checkbox"
            checked={adultMode}
            onChange={toggleAdultMode}
            className="w-6 h-6 accent-indigo-500 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
      </div>

      {/* Key Management */}
        <div className="border-t border-slate-200 pt-6 mt-6">
        <button 
          onClick={handleClearKey}
          className="w-full py-3 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 group"
        >
          <span className="group-hover:scale-110 transition-transform">🔑</span>
          <span>Reset Magic Key</span>
        </button>
      </div>
    </div>
  );

  if (gameState.stage === 'input' || gameState.stage === 'processing') {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
        <style>
            {`
            @keyframes floatUp {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -100%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -300%) scale(1); opacity: 0; }
            }
            .animate-float-up {
                animation: floatUp 0.8s ease-out forwards;
            }
            `}
        </style>
        {/* Floating Save Icon - Rendered at root of this view to persist briefly during transitions if needed */}
        {saveAnim && (
            <div 
                className="fixed pointer-events-none z-50 animate-float-up text-4xl filter drop-shadow-md"
                style={{ left: saveAnim.x, top: saveAnim.y }}
            >
                💾
            </div>
        )}

        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-6 relative">
            {/* Always visible toggle in top right of card (Icon based) */}
            <button 
                onClick={toggleAdultMode}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition-colors group z-10"
                title={adultMode ? "Disable Transparent Mode" : "Enable Transparent Mode"}
            >
                <svg 
                    className={`w-6 h-6 transition-colors ${adultMode ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-500'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>

          <div className="text-center mb-6">
            <Logo size="large" className="mb-2" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{APP_VERSION}</span>
          </div>

          {/* Cooldown Indicator */}
          {timeLeft > 0 && (
            <div className="mb-6 mx-auto max-w-sm bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 flex flex-col items-center shadow-sm animate-pulse">
                <div className="flex items-center gap-2 mb-2 font-bold text-orange-400">
                    <span className="animate-bounce">💤</span>
                    <span>Magic Pencil Recharging...</span>
                    <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md font-mono">{timeLeft}s</span>
                </div>
                 <div className="w-full h-3 bg-orange-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-orange-400 transition-all duration-300 ease-linear"
                        style={{ width: `${(timeLeft / (COOLDOWN_MS / 1000)) * 100}%` }}
                    />
                </div>
            </div>
          )}

          {showGallery ? (
            <div className="animate-fade-in-up">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" /></svg></button>
                    <h3 className="text-2xl font-bold text-slate-700">Gallery</h3>
                  </div>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all"
                    title="Home"
                   >
                    <span>🏠</span>
                    <span>Home</span>
                   </button>
               </div>
               {savedGames.length === 0 ? <div className="text-center py-10 text-slate-400">Empty!</div> : 
               <div className="space-y-3">{savedGames.map(s => (
                  <div key={s.id} onClick={() => loadGame(s)} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 flex items-center gap-4 cursor-pointer">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">🎨</div>
                      <div className="flex-1 font-bold text-slate-700 capitalize">{s.prompt}</div>
                      <button onClick={(e) => deleteSave(e, s.id)} className="text-red-300 hover:text-red-500">🗑️</button>
                  </div>
               ))}</div>}
            </div>
          ) : selectedCategory ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => handleSelectCategory(null)} 
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
                  >
                     <span className="text-xl">←</span> Back
                  </button>
                  <h3 className="text-xl font-black text-slate-700">
                    {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                  </h3>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all"
                    title="Home"
                   >
                    <span>🏠</span>
                    <span>Home</span>
                   </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORIES.find(c => c.id === selectedCategory)?.items.map(i => (
                  <button 
                    key={i.label} 
                    disabled={timeLeft > 0}
                    onClick={() => handleStart(generateSmartPrompt(selectedCategory, i.label, i.prompt))} 
                    className="h-40 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-300 hover:bg-indigo-50 flex flex-col items-center justify-center transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="text-6xl mb-3 transform transition-transform group-hover:scale-110">{i.emoji}</span>
                    <span className="font-bold text-slate-700 text-lg">{i.label}</span>
                  </button>
                ))}
              </div>
              {renderSettings()}
            </div>
          ) : (
            <div>
              <button 
                onClick={() => setShowGallery(true)} 
                className={`w-full mb-6 bg-indigo-50 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-100 transition-all duration-300 ${justSaved ? 'scale-105 ring-4 ring-green-400 bg-green-50 text-green-600 shadow-lg' : ''}`}
              >
                  {justSaved ? 'Saved to Gallery! 💾' : `View Gallery (${savedGames.length})`}
              </button>
              
              {/* HEX GRID CATEGORY MENU */}
              {renderCategoryHexGrid()}
              
              {renderSettings()}
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl text-center shadow-sm animate-shake">
              <p className="font-bold mb-2">{error}</p>
              {(error.includes("Magic Key") || error.includes("API Key") || error.includes("permission")) && (
                <button 
                  onClick={handleClearKey}
                  className="bg-white text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
                >
                  🔑 Fix Magic Key
                </button>
              )}
            </div>
          )}

          {/* Loading Overlay - Only show for global loading, not local button saving */}
          {loading && !isSaving && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 rounded-3xl z-20 text-center">
              {adultMode ? (
                <div className="max-w-lg w-full text-left font-mono text-xs sm:text-sm bg-slate-900 text-green-400 p-6 rounded-xl shadow-2xl overflow-hidden border border-slate-700 animate-fade-in-up">
                   <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                      <span className="font-bold text-white tracking-widest">TRANSPARENT MODE</span>
                      <span className="animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        PROCESSING
                      </span>
                   </div>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500 block mb-1 font-bold">MODEL:</span>
                          <span className="text-yellow-300">{GENERATION_MODEL_NAME}</span>
                        </div>
                         <div>
                          <span className="text-slate-500 block mb-1 font-bold">EST. INPUT TOKENS:</span>
                          <span className="text-blue-300">~{Math.ceil(constructGenerationPrompt(gameState.prompt, gameState.style).length / 4)}</span>
                        </div>
                      </div>
                      
                      <div>
                          <span className="text-slate-500 block mb-1 font-bold">SYSTEM PROMPT:</span>
                          <div className="whitespace-pre-wrap break-words opacity-90 border-l-2 border-slate-700 pl-3 max-h-32 overflow-y-auto custom-scrollbar">
                              {constructGenerationPrompt(gameState.prompt, gameState.style)}
                          </div>
                      </div>

                      <div className="border-t border-slate-700 pt-2 mt-2">
                         <span className="text-slate-500 block mb-1 font-bold uppercase">Free Tier Quota (Ref):</span>
                         <ul className="text-[10px] text-slate-400 list-disc pl-4 space-y-1">
                            <li>Requests: ~1,500 / Day</li>
                            <li>Rate: ~15 / Minute</li>
                            <li><span className="text-green-500">Free of charge</span> (if billing disabled)</li>
                         </ul>
                      </div>
                   </div>
                </div>
              ) : (
                <>
                  <div className="animate-bounce text-6xl mb-4">✨</div>
                  <div className="text-xl font-bold text-indigo-600">Making Magic...</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.stage === 'complete') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4 relative">
        <h1 className="text-5xl font-black text-white mb-8 animate-bounce">Perfect! 🎉</h1>
        <div className="bg-white p-4 rounded-xl shadow-2xl mb-8">
           <div className="grid" style={{ gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)`, width: 'min(80vw, 400px)', aspectRatio: '1/1' }}>
             {gameState.grid.map((p, i) => <div key={i} style={{ backgroundColor: gameState.palette[p.colorIndex] }} />)}
           </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleSaveAndHome} variant="primary">Save Picture</Button>
          <Button onClick={() => setShowRestartConfirm(true)} variant="secondary">Restart</Button>
        </div>

        {/* Restart Confirmation Modal */}
        {showRestartConfirm && (
            <div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center border-4 border-indigo-100">
                    <div className="text-4xl mb-3">🔄</div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Start Over?</h3>
                    <p className="text-slate-500 mb-6 font-medium">Do you want to clear this picture and paint it again?</p>
                    <div className="flex gap-3">
                        <Button onClick={handleRestartPuzzle} variant="danger" className="flex-1">Yes, Restart</Button>
                        <Button onClick={() => setShowRestartConfirm(false)} variant="secondary" className="flex-1">No, Cancel</Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      <header className="flex-none bg-white p-3 shadow-sm z-10 flex items-center justify-between">
        <button onClick={resetGame} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 border-2 border-slate-200 hover:border-slate-300">
            <span className="text-xl">🏠</span>
            <span>Home</span>
        </button>
        <div className="flex gap-2">
            <button onClick={handleHint} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-600 p-2 px-3 rounded-full font-bold transition-colors">💡 Hint</button>
            <button onClick={handleUndo} disabled={past.length === 0} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full disabled:opacity-30 transition-colors">↩️</button>
            <button onClick={handleRedo} disabled={future.length === 0} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full disabled:opacity-30 transition-colors">↪️</button>
        </div>
        <button onClick={saveGame} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-black shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 border-b-4 border-green-700 active:border-b-0 active:translate-y-1">
            <span className="text-xl">💾</span>
            <span>Save</span>
        </button>
      </header>
      <main className="flex-1 overflow-y-auto flex flex-col items-center pt-8 pb-40 relative">
        <PixelGrid 
            grid={gameState.grid} 
            gridSize={gameState.gridSize} 
            activeColorIndex={gameState.activeColorIndex} 
            onPaintPixels={handlePaintPixels} 
            palette={gameState.palette} 
            hintPixelIndex={hintPixelIndex}
            difficulty={gameState.difficulty}
        />
        
        {/* Floating Brush Size Selector */}
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur shadow-xl rounded-2xl p-1.5 flex gap-2 border border-slate-200 z-40">
           {[
              { id: 'easy', label: 'Big', icon: '🖌️' },
              { id: 'medium', label: 'Med', icon: '🖌️' },
              { id: 'hard', label: 'Small', icon: '✏️' }
           ].map(d => (
             <button
               key={d.id}
               onClick={() => setGameState(prev => ({...prev, difficulty: d.id as any}))}
               className={`
                 flex flex-col items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[60px]
                 ${gameState.difficulty === d.id 
                   ? 'bg-indigo-100 text-indigo-600 shadow-sm ring-2 ring-indigo-500' 
                   : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}
               `}
             >
               <span className="text-lg">{d.icon}</span>
               <span>{d.label}</span>
             </button>
           ))}
        </div>
      </main>
      <ColorPalette palette={gameState.palette} activeColorIndex={gameState.activeColorIndex} unlockedColorIndex={0} onSelectColor={(idx) => setGameState(p => ({ ...p, activeColorIndex: idx }))} completedColors={gameState.palette.map((_, idx) => !gameState.grid.some(p => p.colorIndex === idx && !p.isColored))} />
      {showToast && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-2 rounded-full z-50">Saved!</div>}
    </div>
  );
};

export default App;