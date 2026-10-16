const QUOTES = [
  "A little every day goes a long way.",
  "Write it down. It matters more than you think.",
  "Small moments make a big life.",
  "Notice one good thing today.",
  "Your story is worth keeping.",
  "Slow down. You’re allowed to.",
  "Today is a fresh page.",
  "Be gentle with yourself.",
  "What you pay attention to grows.",
  "One honest sentence is enough.",
  "The ordinary days count too.",
  "Breathe in, write out.",
  "You don’t have to have it all figured out.",
  "Keep what you want to remember.",
  "Every day holds something worth noting.",
  "Progress, not perfection.",
  "Make a little room for quiet.",
  "Your future self will thank you.",
  "It’s okay to start small.",
  "Feelings are easier held on paper.",
  "Celebrate the small wins.",
  "Rest is part of the work.",
  "Look back to see how far you’ve come.",
  "Curiosity is a good companion.",
  "There’s beauty in the everyday.",
  "Say thank you to today.",
  "Let the words come as they are.",
  "You’re doing better than you think.",
  "Tend to your thoughts like a garden.",
  "Begin where you are.",
  "Little by little, a little becomes a lot.",
];

/** A quote that stays the same all day and changes at local midnight. */
export function dailyQuote(timeZone: string, date = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone }).format(date).split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return QUOTES[day % QUOTES.length];
}
