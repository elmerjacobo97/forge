export type Unit = "words" | "sentences" | "paragraphs"
export type OutputFormat = "plain" | "html" | "markdown" | "json"

export interface GenerateOptions {
  unit: Unit
  count: number
  startWithLorem: boolean
  format: OutputFormat
}

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomWord(): string {
  return WORDS[randomInt(0, WORDS.length - 1)]
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function generateWordList(count: number, startWithLorem: boolean): string[] {
  const words: string[] = []
  if (startWithLorem && count >= 5) {
    words.push("lorem", "ipsum", "dolor", "sit", "amet")
  }
  while (words.length < count) {
    words.push(randomWord())
  }
  return words.slice(0, count)
}

function generateSentence(wordCount: number, startWithLorem: boolean): string {
  const words = generateWordList(wordCount, startWithLorem)
  if (words.length > 0) {
    words[0] = capitalize(words[0])
  }
  return `${words.join(" ")}.`
}

function generateSentences(count: number, startWithLorem: boolean): string[] {
  return Array.from({ length: count }, (_, i) =>
    generateSentence(randomInt(5, 15), i === 0 && startWithLorem)
  )
}

function generateParagraphs(count: number, startWithLorem: boolean): string[] {
  return Array.from({ length: count }, (_, i) => {
    const sentenceCount = randomInt(3, 7)
    const sentences = generateSentences(sentenceCount, i === 0 && startWithLorem)
    return sentences.join(" ")
  })
}

function formatWords(words: string[], format: OutputFormat): string {
  switch (format) {
    case "html":
      return words.map((w) => `<span>${w}</span>`).join(" ")
    case "json":
      return JSON.stringify(words, null, 2)
    case "markdown":
    case "plain":
    default:
      return words.join(" ")
  }
}

function formatSentences(sentences: string[], format: OutputFormat): string {
  switch (format) {
    case "html":
      return `<ul>\n${sentences.map((s) => `  <li>${s}</li>`).join("\n")}\n</ul>`
    case "markdown":
      return sentences.map((s) => `- ${s}`).join("\n")
    case "json":
      return JSON.stringify(sentences, null, 2)
    case "plain":
    default:
      return sentences.join(" ")
  }
}

function formatParagraphs(paragraphs: string[], format: OutputFormat): string {
  switch (format) {
    case "html":
      return paragraphs.map((p) => `<p>${p}</p>`).join("\n")
    case "markdown":
    case "plain":
      return paragraphs.join("\n\n")
    case "json":
      return JSON.stringify(paragraphs, null, 2)
    default:
      return paragraphs.join("\n\n")
  }
}

export function generateLorem(options: GenerateOptions): string {
  const count = Math.max(1, options.count)

  switch (options.unit) {
    case "words": {
      const words = generateWordList(count, options.startWithLorem)
      return formatWords(words, options.format)
    }
    case "sentences": {
      const sentences = generateSentences(count, options.startWithLorem)
      return formatSentences(sentences, options.format)
    }
    case "paragraphs": {
      const paragraphs = generateParagraphs(count, options.startWithLorem)
      return formatParagraphs(paragraphs, options.format)
    }
  }
}

export function clampCount(unit: Unit, count: number): number {
  const max = unit === "words" ? 1000 : unit === "sentences" ? 100 : 50
  return Math.max(1, Math.min(max, Math.floor(count)))
}
