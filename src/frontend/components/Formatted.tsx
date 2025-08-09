import { JSX, ComponentChild } from 'preact'

// The formatted component.
export default (properties: FormattedProperties): ComponentChild => {
  const parser = new Parser(properties.content)
  const parts: Node[] = []

  while (true){
    const node = parser.next()

    if (node === null) {
      break
    }

    parts.push(node)
  }

  return (
    <properties.tag {...properties}>
      {
        parts.map((part) => {
          if (part.type === 'text') {
            return (
              <span>{part.content}</span>
            )
          } else if (part.type === 'ruby') {
            return (
              <ruby>
                {part.content}
                <rt style={{ fontSize: '75%' }}>{part.pronunciation}</rt>
              </ruby>
            )
          }
        })
      }
    </properties.tag>
  )
}

// The properties of the formatted component.
export type FormattedProperties = JSX.HTMLAttributes<HTMLHeadingElement> & {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p'
  content: string
}

// The parser.
class Parser {
  public content!: string
  public index: number = 0

  constructor (content: string) {
    this.content = content
  }

  // Parse the next node.
  public next (): null | Node {
    const start = this.index

    if (this.index === this.content.length) {
      return null
    }
   
    if (this.content.codePointAt(this.index) === 123) {
      while (this.index < this.content.length) {
        if (this.content.codePointAt(this.index) === 125) {
          const parts = this.content.substring(start + 1, this.index).split(':')

          if (parts.length !== 2) {
            return { type: 'text', content: this.content.substring(start + 1, this.index) }
          }

          this.index++

          return { type: 'ruby', content: parts[0], pronunciation: parts[1] }
        }

        this.index++
      }
    } else {
      while (this.index < this.content.length) {
        if (this.content.codePointAt(this.index) === 123) {
          break
        }

        this.index++
      }

      return { type: 'text', content: this.content.substring(start, this.index) }
    }

    return null
  }
}

// The data structure of a node.
type Node = {
  type: 'text',
  content: string
} | {
  type: 'ruby',
  content: string,
  pronunciation: string
}

// The data structure of a part.
export type FormattedPart = {
  type: 'text',
  content: string
} | {
  type: 'ruby',
  primary: string,
  secondary: string
}
