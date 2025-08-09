import { ComponentChild } from 'preact'
import * as lucid from 'lucide-preact'
import { Link } from 'wouter-preact'

// The header element.
export default (): ComponentChild => {
  return (
    <nav class='box-shadow' style={{ display: 'flex', gap: 'var(--spacing-big)', backgroundColor: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', margin: 'var(--spacing-medium)' }}>
      <Link href='/' style={{ lineHeight: 1 }}>
        <lucid.House class='icon-button' style={{ color: 'var(--color-foreground)' }}/>
      </Link>

      <Link href='/statistics' style={{ lineHeight: 1 }}>
        <lucid.ChartNoAxesCombined class='icon-button' style={{ color: 'var(--color-foreground)' }}/>
      </Link>

      <div style={{ flex: 1 }}></div>

      <Link href='/create' style={{ lineHeight: 1 }}>
        <lucid.BookPlus class='icon-button' style={{ color: 'var(--color-foreground)' }}/>
      </Link>

      <Link href='/import' style={{ lineHeight: 1 }}>
        <lucid.BookDown class='icon-button' style={{ color: 'var(--color-foreground)' }}/>
      </Link>

      <Link href='/explore' style={{ lineHeight: 1 }}>
        <lucid.Compass class='icon-button' style={{ color: 'var(--color-foreground)' }}/>
      </Link>
    </nav>
  )
}
