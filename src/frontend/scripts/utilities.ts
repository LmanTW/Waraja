import * as fs from '@tauri-apps/plugin-fs'

// Ensure the application folder is complete.
export async function ensureComplete (): Promise<Result<string, null>> { 
  try {
    if (!await fs.exists('./Waraja', { baseDir: fs.BaseDirectory.Data })) {
      await fs.mkdir('./Waraja', { baseDir: fs.BaseDirectory.Data })
    }

    if (!await fs.exists('./Waraja/library', { baseDir: fs.BaseDirectory.Data })) {
      await fs.mkdir('./Waraja/library', { baseDir: fs.BaseDirectory.Data })
    }

    if (!await fs.exists('./Waraja/cache', { baseDir: fs.BaseDirectory.Data })) {
      await fs.mkdir('./Waraja/cache', { baseDir: fs.BaseDirectory.Data })
    }
  } catch (_) {
    return { error: 'Something went wrong while checking the application data.', data: null }
  }

  return { error: null, data: null }
}

// Hash a string using SHA256 with Hex encoding.
export async function hash (data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// The result of an operation. (ET = Error Type, DT = Data Type)
export type Result <ET, DT> = { error: ET, data: null } | { error: null, data: DT }
