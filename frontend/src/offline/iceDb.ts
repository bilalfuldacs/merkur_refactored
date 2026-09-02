const DB_NAME = 'merkur-ice2027'
const DB_VERSION = 1

export type IcePendingQuestionnaire = {
  id: string
  kind: 'questionnaire'
  competitorId: number
  products: unknown
  savedAt: number
}

export type IcePendingEvaluation = {
  id: 'evaluation'
  kind: 'evaluation'
  top5: unknown
  savedAt: number
}

export type IcePendingItem = IcePendingQuestionnaire | IcePendingEvaluation

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv')
      }
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('ICE offline storage could not be opened.'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('ICE offline storage failed.'))
  })
}

export async function iceKvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  try {
    return await requestToPromise(db.transaction('kv', 'readonly').objectStore('kv').get(key)) as T | undefined
  } finally {
    db.close()
  }
}

export async function iceKvSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  try {
    await requestToPromise(db.transaction('kv', 'readwrite').objectStore('kv').put(value, key))
  } finally {
    db.close()
  }
}

export async function iceKvClear(): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(['kv', 'pending'], 'readwrite')
    await Promise.all([requestToPromise(tx.objectStore('kv').clear()), requestToPromise(tx.objectStore('pending').clear())])
  } finally {
    db.close()
  }
}

export async function icePendingPut(item: IcePendingItem): Promise<void> {
  const db = await openDb()
  try {
    await requestToPromise(db.transaction('pending', 'readwrite').objectStore('pending').put(item))
  } finally {
    db.close()
  }
}

export async function icePendingDelete(id: string): Promise<void> {
  const db = await openDb()
  try {
    await requestToPromise(db.transaction('pending', 'readwrite').objectStore('pending').delete(id))
  } finally {
    db.close()
  }
}

export async function icePendingGet<T extends IcePendingItem>(id: string): Promise<T | undefined> {
  const db = await openDb()
  try {
    return await requestToPromise(db.transaction('pending', 'readonly').objectStore('pending').get(id)) as T | undefined
  } finally {
    db.close()
  }
}

export async function icePendingAll(): Promise<IcePendingItem[]> {
  const db = await openDb()
  try {
    return await requestToPromise(db.transaction('pending', 'readonly').objectStore('pending').getAll())
  } finally {
    db.close()
  }
}
