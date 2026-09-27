class AsyncLocalStorage<T = unknown> {
  private current: T | undefined;
  private entered: T | undefined;

  getStore(): T | undefined {
    return this.current ?? this.entered;
  }

  run<R>(store: T, callback: (...args: never[]) => R, ...args: never[]): R {
    const previous = this.current;
    this.current = store;
    try {
      return callback(...args);
    } finally {
      this.current = previous;
    }
  }

  enterWith(store: T): void {
    this.entered = store;
  }

  disable(): void {}

  enable(): void {}

  exit<R>(callback: (...args: never[]) => R, ...args: never[]): R {
    const previous = this.current;
    this.current = undefined;
    try {
      return callback(...args);
    } finally {
      this.current = previous;
    }
  }

  static snapshot(): never {
    throw new Error("AsyncLocalStorage.snapshot is not available in the browser");
  }
}

export { AsyncLocalStorage };