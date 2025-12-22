import { ref } from 'vue'

export function useGameLogic() {
  const suits = ['s', 'h', 'd', 'c']
  const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

  const createDeck = () => {
    const deck = []
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank })
      }
    }
    deck.push({ suit: 'j', rank: 0 })
    return deck
  }

  const shuffle = (deck) => {
    const newDeck = [...deck]
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }
    return newDeck
  }

  return {
    createDeck,
    shuffle
  }
}