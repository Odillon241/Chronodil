'use client'

import { useState, useCallback, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, Smile, Clock } from 'lucide-react'

// Interface pour une catégorie d'emojis
interface EmojiCategory {
  name: string
  icon: ReactNode
  emojis: string[]
}

// Catégories d'emojis
const emojiCategories: Record<string, EmojiCategory> = {
  recent: {
    name: 'Récent',
    icon: <Clock className="h-4 w-4" />,
    emojis: [], // Sera rempli dynamiquement
  },
  smileys: {
    name: 'Smileys',
    icon: <Smile className="h-4 w-4" />,
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '😮‍💨',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '🥸',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '☹️',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡',
      '😠',
      '🤬',
      '😈',
      '👿',
      '💀',
      '☠️',
      '💩',
      '🤡',
      '👹',
      '👺',
      '👻',
      '👽',
    ],
  },
  gestures: {
    name: 'Gestes',
    icon: <span className="text-sm">👍</span>,
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💪',
      '🦾',
      '🦵',
      '🦶',
      '👂',
      '🦻',
      '👃',
      '🧠',
      '🫀',
      '🫁',
      '🦷',
      '🦴',
      '👀',
      '👁️',
      '👅',
      '👄',
      '💋',
      '🩸',
    ],
  },
  hearts: {
    name: 'Coeurs',
    icon: <span className="text-sm">❤️</span>,
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '♥️',
      '😍',
      '🥰',
      '😘',
      '😻',
      '💑',
      '👩‍❤️‍👨',
      '👨‍❤️‍👨',
      '👩‍❤️‍👩',
      '💏',
      '💌',
    ],
  },
  nature: {
    name: 'Nature',
    icon: <span className="text-sm">🌸</span>,
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐻‍❄️',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🪱',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🦟',
      '🦗',
      '🪳',
      '🕷️',
      '🦂',
      '🌸',
      '💮',
      '🏵️',
      '🌹',
      '🥀',
      '🌺',
      '🌻',
      '🌼',
      '🌷',
      '🌱',
      '🪴',
      '🌲',
      '🌳',
      '🌴',
      '🌵',
      '🌾',
      '🌿',
      '☘️',
      '🍀',
      '🍁',
    ],
  },
  food: {
    name: 'Nourriture',
    icon: <span className="text-sm">🍕</span>,
    emojis: [
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🫓',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🫔',
      '🥗',
      '🥘',
      '🫕',
      '🍝',
      '🍜',
      '🍲',
      '🍛',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍚',
      '🍘',
      '🍥',
      '🥠',
      '🥮',
      '🍢',
      '🍡',
      '🍧',
      '🍨',
      '🍦',
      '🥧',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
      '🌰',
      '🥜',
      '🍯',
      '🥛',
      '🍼',
      '☕',
      '🫖',
      '🍵',
      '🧃',
    ],
  },
  activities: {
    name: 'Activités',
    icon: <span className="text-sm">⚽</span>,
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️',
      '🤼',
      '🤸',
      '⛹️',
      '🤺',
      '🤾',
      '🏌️',
      '🏇',
      '⛹️',
      '🏊',
      '🚣',
      '🧗',
      '🚵',
      '🚴',
      '🎪',
      '🎭',
      '🎨',
      '🎬',
      '🎤',
      '🎧',
      '🎼',
      '🎹',
      '🥁',
      '🪘',
      '🎷',
      '🎺',
      '🪗',
      '🎸',
      '🪕',
      '🎻',
      '🎲',
      '♟️',
      '🎯',
      '🎳',
      '🎮',
      '🎰',
      '🧩',
      '🎁',
      '🎀',
      '🎊',
      '🎉',
      '🎈',
      '🎄',
      '🎃',
    ],
  },
  objects: {
    name: 'Objets',
    icon: <span className="text-sm">💡</span>,
    emojis: [
      '⌚',
      '📱',
      '📲',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '🖲️',
      '🕹️',
      '🗜️',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '🧭',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
      '🔋',
      '🔌',
      '💡',
      '🔦',
      '🕯️',
      '🪔',
      '🧯',
      '🛢️',
      '💸',
      '💵',
      '💴',
      '💶',
      '💷',
      '🪙',
      '💰',
      '💳',
      '💎',
      '⚖️',
      '🪜',
      '🧰',
      '🪛',
      '🔧',
      '🔨',
      '⚒️',
      '🛠️',
      '⛏️',
      '🪚',
      '🔩',
      '⚙️',
      '🪤',
      '🧱',
      '⛓️',
      '🧲',
      '🔫',
      '💣',
      '🧨',
      '🪓',
      '🔪',
      '🗡️',
      '⚔️',
      '🛡️',
      '🚬',
      '⚰️',
      '🪦',
      '⚱️',
      '🏺',
      '🔮',
      '📿',
      '🧿',
      '💈',
      '⚗️',
      '🔭',
      '🔬',
      '🕳️',
      '🩹',
      '🩺',
      '💊',
      '💉',
      '🩸',
      '🧬',
      '🦠',
      '🧫',
    ],
  },
  symbols: {
    name: 'Symboles',
    icon: <span className="text-sm">✨</span>,
    emojis: [
      '✨',
      '⭐',
      '🌟',
      '💫',
      '⚡',
      '🔥',
      '💥',
      '☀️',
      '🌤️',
      '⛅',
      '🌈',
      '☁️',
      '🌧️',
      '⛈️',
      '🌩️',
      '❄️',
      '☃️',
      '⛄',
      '🌊',
      '💧',
      '💦',
      '☔',
      '🎵',
      '🎶',
      '🔇',
      '🔈',
      '🔉',
      '🔊',
      '📢',
      '📣',
      '💬',
      '💭',
      '🗯️',
      '♠️',
      '♣️',
      '♥️',
      '♦️',
      '🃏',
      '🎴',
      '🀄',
      '🔘',
      '🔴',
      '🟠',
      '🟡',
      '🟢',
      '🔵',
      '🟣',
      '⚫',
      '⚪',
      '🟤',
      '✅',
      '☑️',
      '✔️',
      '❌',
      '❎',
      '➕',
      '➖',
      '➗',
      '✖️',
      '♾️',
      '❓',
      '❔',
      '❕',
      '❗',
      '‼️',
      '⁉️',
      '💯',
      '🔆',
      '🔅',
      '〽️',
      '⚠️',
      '🚸',
      '⛔',
      '🚫',
      '🚳',
      '🚭',
      '🚯',
      '🚱',
      '🚷',
      '📵',
      '♻️',
      '✳️',
      '❇️',
      '✴️',
      '🔰',
      '🔱',
      '⚜️',
      '🔻',
      '🔺',
      '🔸',
      '🔶',
      '🔷',
      '🔹',
      '▪️',
      '▫️',
      '◾',
      '◽',
      '◼️',
      '◻️',
      '🟥',
    ],
  },
  flags: {
    name: 'Drapeaux',
    icon: <span className="text-sm">🏳️</span>,
    emojis: [
      '🏁',
      '🚩',
      '🎌',
      '🏴',
      '🏳️',
      '🏳️‍🌈',
      '🏳️‍⚧️',
      '🏴‍☠️',
      '🇫🇷',
      '🇬🇧',
      '🇺🇸',
      '🇩🇪',
      '🇪🇸',
      '🇮🇹',
      '🇵🇹',
      '🇧🇪',
      '🇨🇭',
      '🇳🇱',
      '🇦🇹',
      '🇵🇱',
      '🇨🇦',
      '🇦🇺',
      '🇯🇵',
      '🇨🇳',
      '🇰🇷',
      '🇮🇳',
      '🇧🇷',
      '🇲🇽',
      '🇦🇷',
      '🇿🇦',
      '🇪🇺',
      '🇺🇳',
      '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      '🇷🇺',
      '🇺🇦',
      '🇹🇷',
      '🇬🇷',
      '🇸🇪',
    ],
  },
}

// Clé localStorage pour les emojis récents
const RECENT_EMOJIS_KEY = 'chat-recent-emojis'
const MAX_RECENT_EMOJIS = 24

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  trigger?: React.ReactNode
  className?: string
}

export function EmojiPicker({ onEmojiSelect, trigger, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  // Charger les emojis récents au montage
  useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY)
      if (stored) {
        setRecentEmojis(JSON.parse(stored))
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  })

  // Sauvegarder un emoji dans les récents
  const saveToRecent = useCallback((emoji: string) => {
    setRecentEmojis((prev) => {
      const newRecent = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, MAX_RECENT_EMOJIS)
      try {
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent))
      } catch {
        // Ignorer les erreurs de stockage
      }
      return newRecent
    })
  }, [])

  // Sélectionner un emoji
  const handleSelect = useCallback(
    (emoji: string) => {
      saveToRecent(emoji)
      onEmojiSelect(emoji)
      setOpen(false)
      setSearchQuery('')
    },
    [onEmojiSelect, saveToRecent],
  )

  // Filtrer les emojis par recherche
  const getFilteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) return null

    const _query = searchQuery.toLowerCase()
    const allEmojis: string[] = []

    Object.values(emojiCategories).forEach((category) => {
      if (category.name !== 'Récent') {
        allEmojis.push(...category.emojis)
      }
    })

    // Filtrage simple: on ne peut pas vraiment chercher par nom d'emoji sans une table de mapping
    // Donc on retourne tous les emojis qui contiennent la recherche dans leur représentation
    return [...new Set(allEmojis)]
  }, [searchQuery])

  const filteredEmojis = getFilteredEmojis()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={cn('h-8 w-8', className)}>
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
        {/* Barre de recherche */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un emoji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Contenu */}
        {searchQuery.trim() ? (
          // Résultats de recherche
          <div className="p-2 h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis?.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  onClick={() => handleSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Catégories
          <Tabs defaultValue="smileys" className="w-full">
            <TabsList className="w-full h-auto p-1 grid grid-cols-5 sm:grid-cols-10 bg-muted/50">
              {recentEmojis.length > 0 && (
                <TabsTrigger value="recent" className="p-1.5" title="Récent">
                  <Clock className="h-4 w-4" />
                </TabsTrigger>
              )}
              {Object.entries(emojiCategories).map(([key, category]) => {
                if (key === 'recent') return null
                return (
                  <TabsTrigger key={key} value={key} className="p-1.5" title={category.name}>
                    {category.icon}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Emojis récents */}
            {recentEmojis.length > 0 && (
              <TabsContent value="recent" className="mt-0 p-2 h-64 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">Récemment utilisés</p>
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((emoji, idx) => (
                    <button
                      key={`recent-${emoji}-${idx}`}
                      onClick={() => handleSelect(emoji)}
                      className="h-8 w-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* Catégories d'emojis */}
            {Object.entries(emojiCategories).map(([key, category]) => {
              if (key === 'recent') return null
              return (
                <TabsContent key={key} value={key} className="mt-0 p-2 h-64 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-2">{category.name}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, idx) => (
                      <button
                        key={`${key}-${emoji}-${idx}`}
                        onClick={() => handleSelect(emoji)}
                        className="h-8 w-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Composant simplifié pour les réactions rapides (6 emojis populaires)
interface QuickEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  showFullPicker?: boolean
}

export function QuickEmojiPicker({ onEmojiSelect, showFullPicker = true }: QuickEmojiPickerProps) {
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  return (
    <div className="flex items-center gap-1">
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="h-7 w-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
        >
          {emoji}
        </button>
      ))}
      {showFullPicker && (
        <EmojiPicker
          onEmojiSelect={onEmojiSelect}
          trigger={
            <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded transition-colors">
              <Smile className="h-4 w-4" />
            </button>
          }
        />
      )}
    </div>
  )
}
