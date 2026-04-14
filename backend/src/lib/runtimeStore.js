import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const runtimeStorePath = path.resolve(__dirname, '../data/runtimeStore.json')

const createDefaultStore = () => ({
  driverLocation: {
    latest: null,
    history: [],
  },
  driverMessage: {
    latest: null,
    history: [],
  },
})

const normalizeStore = (value) => {
  const store = createDefaultStore()

  if (!value || typeof value !== 'object') {
    return store
  }

  if (value.driverLocation && typeof value.driverLocation === 'object') {
    store.driverLocation.latest = value.driverLocation.latest ?? null
    store.driverLocation.history = Array.isArray(value.driverLocation.history)
      ? value.driverLocation.history
      : []
  }

  if (value.driverMessage && typeof value.driverMessage === 'object') {
    store.driverMessage.latest = value.driverMessage.latest ?? null
    store.driverMessage.history = Array.isArray(value.driverMessage.history)
      ? value.driverMessage.history
      : []
  }

  return store
}

const writeRuntimeStore = async (store) => {
  await mkdir(path.dirname(runtimeStorePath), { recursive: true })
  await writeFile(runtimeStorePath, JSON.stringify(store, null, 2), 'utf8')
}

const readRuntimeStore = async () => {
  try {
    const raw = await readFile(runtimeStorePath, 'utf8')
    const parsed = JSON.parse(raw)
    return normalizeStore(parsed)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[runtime-store] Failed to read store. Resetting to defaults.', error.message)
    }

    const freshStore = createDefaultStore()
    await writeRuntimeStore(freshStore)
    return freshStore
  }
}

export const pushDriverLocation = async (record) => {
  const store = await readRuntimeStore()

  store.driverLocation.latest = record
  store.driverLocation.history = [record, ...store.driverLocation.history].slice(0, 200)

  await writeRuntimeStore(store)
  return store.driverLocation
}

export const pushDriverMessage = async (record) => {
  const store = await readRuntimeStore()

  store.driverMessage.latest = record
  store.driverMessage.history = [record, ...store.driverMessage.history].slice(0, 100)

  await writeRuntimeStore(store)
  return store.driverMessage
}

export const getDriverLocationState = async () => {
  const store = await readRuntimeStore()
  return store.driverLocation
}

export const getDriverMessageState = async () => {
  const store = await readRuntimeStore()
  return store.driverMessage
}
