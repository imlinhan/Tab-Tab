const QUOTES = [
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: 'Move fast and break things.', author: 'Mark Zuckerberg' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { text: 'Any fool can write code that a computer can understand.', author: 'Martin Fowler' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', author: 'Antoine de Saint-Exupéry' },
  { text: 'The most dangerous phrase in the language is "We\'ve always done it this way."', author: 'Grace Hopper' },
  { text: 'Measuring programming progress by lines of code is like measuring aircraft building progress by weight.', author: 'Bill Gates' },
  { text: 'It\'s not a bug; it\'s an undocumented feature.', author: 'Anonymous' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '知之为知之，不知为不知，是知也。', author: '孔子' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
];

export function initQuotes(): void {
  const textEl = document.getElementById('quoteText');
  const authorEl = document.getElementById('quoteAuthor');
  if (!textEl || !authorEl) return;

  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % QUOTES.length;
  const quote = QUOTES[dayIndex];

  textEl.textContent = `"${quote.text}"`;
  authorEl.textContent = `— ${quote.author}`;
}
