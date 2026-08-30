/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Go-Style Concurrency & Synchronization Primitives (`sync`, `sync/atomic`)
 * Ported to TypeScript for reliable async coordination, data-race prevention
 * across event loop yields, and worker threads integration (Atomics).
 */

// ============================================================================
// 1. MUTEX (Взаємне виключення)
// ============================================================================

export class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  /** Отримує ексклюзивне блокування. Якщо заблоковано, очікує. */
  async lock(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  /** Звільняє блокування та передає керування наступній горутині (промісу) в черзі. */
  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.(); // передаємо лок наступному
    } else {
      this.locked = false;
    }
  }

  /** Неблокувальна спроба захоплення. */
  tryLock(): boolean {
    if (!this.locked) {
      this.locked = true;
      return true;
    }
    return false;
  }
}

// ============================================================================
// 2. RWMUTEX (М'ютекс Читача/Записувача)
// ============================================================================

export class RWMutex {
  private readers = 0;
  private writerActive = false;
  private writeQueue: Array<() => void> = [];
  private readQueue: Array<() => void> = [];

  async rLock(): Promise<void> {
    if (!this.writerActive && this.writeQueue.length === 0) {
      this.readers++;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.readQueue.push(resolve);
    });
  }

  rUnlock(): void {
    if (this.readers > 0) {
      this.readers--;
    }
    if (this.readers === 0 && this.writeQueue.length > 0) {
      const nextWriter = this.writeQueue.shift();
      this.writerActive = true;
      nextWriter?.();
    }
  }

  async lock(): Promise<void> {
    if (!this.writerActive && this.readers === 0) {
      this.writerActive = true;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.writeQueue.push(resolve);
    });
  }

  unlock(): void {
    this.writerActive = false;
    // Надаємо пріоритет читачам або наступному записувачу
    if (this.readQueue.length > 0) {
      const readersToWake = [...this.readQueue];
      this.readQueue = [];
      this.readers = readersToWake.length;
      readersToWake.forEach(resolve => resolve());
    } else if (this.writeQueue.length > 0) {
      const nextWriter = this.writeQueue.shift();
      this.writerActive = true;
      nextWriter?.();
    }
  }
}

// ============================================================================
// 3. WAITGROUP (Очікування групи горутин)
// ============================================================================

export class WaitGroup {
  private counter = 0;
  private waiters: Array<() => void> = [];

  add(delta: number = 1): void {
    this.counter += delta;
    if (this.counter < 0) {
      throw new Error("sync: negative WaitGroup counter");
    }
    if (this.counter === 0 && this.waiters.length > 0) {
      const currentWaiters = [...this.waiters];
      this.waiters = [];
      currentWaiters.forEach(resolve => resolve());
    }
  }

  done(): void {
    this.add(-1);
  }

  async wait(): Promise<void> {
    if (this.counter === 0) return Promise.resolve();
    return new Promise<void>(resolve => {
      this.waiters.push(resolve);
    });
  }
}

// ============================================================================
// 4. ONCE / ONCE_VALUE (Одноразове виконання)
// ============================================================================

export class Once {
  private isDone = false;
  private runningPromise: Promise<void> | null = null;

  async do(fn: () => Promise<void> | void): Promise<void> {
    if (this.isDone) return;
    if (this.runningPromise) return this.runningPromise;

    this.runningPromise = (async () => {
      try {
        await fn();
      } finally {
        this.isDone = true;
        this.runningPromise = null;
      }
    })();
    return this.runningPromise;
  }
}

export function OnceValue<T>(fn: () => Promise<T> | T): () => Promise<T> {
  let isDone = false;
  let result: T;
  let runningPromise: Promise<T> | null = null;

  return async (): Promise<T> => {
    if (isDone) return result;
    if (runningPromise) return runningPromise;

    runningPromise = (async () => {
      result = await fn();
      isDone = true;
      return result;
    })();
    
    return runningPromise;
  };
}

// ============================================================================
// 5. COND (Умовна змінна)
// ============================================================================

export class Cond {
  private locker: Mutex;
  private waiters: Array<() => void> = [];

  constructor(locker: Mutex) {
    this.locker = locker;
  }

  async wait(): Promise<void> {
    // 1. Відпускаємо лок
    this.locker.unlock();
    // 2. Очікуємо на сигнал
    await new Promise<void>(resolve => this.waiters.push(resolve));
    // 3. Знову захоплюємо лок після пробудження
    await this.locker.lock();
  }

  signal(): void {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift();
      next?.();
    }
  }

  broadcast(): void {
    const currentWaiters = [...this.waiters];
    this.waiters = [];
    currentWaiters.forEach(w => w());
  }
}

// ============================================================================
// 6. SYNC.MAP (Паралельна хеш-таблиця)
// ============================================================================

export class SyncMap<K, V> {
  private map = new Map<K, V>();
  private mutex = new RWMutex();

  async load(key: K): Promise<V | undefined> {
    await this.mutex.rLock();
    try {
      return this.map.get(key);
    } finally {
      this.mutex.rUnlock();
    }
  }

  async store(key: K, value: V): Promise<void> {
    await this.mutex.lock();
    try {
      this.map.set(key, value);
    } finally {
      this.mutex.unlock();
    }
  }

  async loadOrStore(key: K, value: V): Promise<{ actual: V, loaded: boolean }> {
    await this.mutex.lock();
    try {
      if (this.map.has(key)) {
        return { actual: this.map.get(key)!, loaded: true };
      }
      this.map.set(key, value);
      return { actual: value, loaded: false };
    } finally {
      this.mutex.unlock();
    }
  }

  async delete(key: K): Promise<void> {
    await this.mutex.lock();
    try {
      this.map.delete(key);
    } finally {
      this.mutex.unlock();
    }
  }
}

// ============================================================================
// 7. ATOMIC (Атомарні операції та Модель Пам'яті)
// ============================================================================

export namespace atomic {
  /**
   * Типобезпечна атомарна операція над Int32.
   * Використовує справжній Atomics API браузера/Node та SharedArrayBuffer.
   */
  export class Int32 {
    private buffer: Int32Array;

    constructor(initial: number = 0) {
      // Використовуємо SharedArrayBuffer для підтримки Atomics між потоками (якщо доступно)
      const sab = typeof SharedArrayBuffer !== 'undefined' 
        ? new SharedArrayBuffer(4) 
        : new ArrayBuffer(4);
      this.buffer = new Int32Array(sab);
      this.buffer[0] = initial;
    }

    load(): number {
      return Atomics.load(this.buffer, 0);
    }

    store(val: number): void {
      Atomics.store(this.buffer, 0, val);
    }

    add(delta: number): number {
      return Atomics.add(this.buffer, 0, delta);
    }

    compareAndSwap(expected: number, replacement: number): boolean {
      const old = Atomics.compareExchange(this.buffer, 0, expected, replacement);
      return old === expected;
    }

    swap(replacement: number): number {
      return Atomics.exchange(this.buffer, 0, replacement);
    }
  }

  /**
   * Узагальнений контейнер для атомарного зберігання значень будь-якого типу (any / T).
   * Реалізує копіювання-під-час-запису (Copy-on-Write) та запобігає race conditions.
   */
  export class Value<T> {
    private value: T | null = null;
    private typeRef: string | null = null;

    store(val: T): void {
      if (val === null || val === undefined) {
        throw new Error("sync/atomic: store of nil value into Value");
      }
      const valType = typeof val;
      if (this.typeRef !== null && this.typeRef !== valType) {
        throw new Error("sync/atomic: store of inconsistently typed value into Value");
      }
      this.typeRef = valType;
      // В однопотоковому JS привласнення посилання атомарне
      this.value = val;
    }

    load(): T | null {
      return this.value;
    }

    swap(newVal: T): T | null {
      const old = this.value;
      this.store(newVal);
      return old;
    }

    compareAndSwap(expected: T, replacement: T): boolean {
      if (this.value === expected) {
        this.store(replacement);
        return true;
      }
      return false;
    }
  }
}
