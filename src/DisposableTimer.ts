export default class DisposableTimer {

  private timeouts: Set<TimerHandle> = new Set()
  private disposed = false

  /**
   * Determines if this timer is currently active, i.e. there are active timeouts.
   */
  public get isActive() {
    return this.timeouts.size > 0
  }

  /**
   * Determines if this timer has been disposed.
   */
  public get isDisposed() {
    return this.disposed
  }

  /**
   * Wrapper around global setTimeout().
   */
  public setTimeout(fn: () => any, ms: number): TimerHandle | null {
    if (this.disposed) { return null }

    const timeout = setTimeout(async () => {
      this.timeouts.delete(timeout)
      this.removeIfInactive()
      fn()
    }, ms)

    this.timeouts.add(timeout)
    ACTIVE_TIMERS.add(this)

    return timeout
  }

  public defer(fn: () => any): TimerHandle | null {
    return this.setTimeout(fn, 0)
  }

  public debounce(fn: () => any, ms: number = 100) {
    this.clearAll()
    return this.setTimeout(fn, ms)
  }

  /**
   * Wrapper around global clearTimeout().
   */
  public clearTimeout(timeout: TimerHandle) {
    clearTimeout(timeout)
    this.timeouts.delete(timeout)
    this.removeIfInactive()
  }

  /**
   * Clears all timeouts.
   */
  public clearAll() {
    if (this.timeouts.size === 0) { return }
    for (const timeout of this.timeouts) {
      clearTimeout(timeout)
    }
    this.timeouts.clear()
    ACTIVE_TIMERS.delete(this)
  }

  /**
   * Utility Promise based delay function.
   */
  public delay(ms: number) {
    return new Promise<void>(resolve => {
      this.setTimeout(resolve, ms)
    })
  }

  // #endregion

  // #regoin Housekeeping

  /**
   * Kills all outstanding tasks of this runner.
   */
  public dispose() {
    this.clearAll()
    this.disposed = true
  }

  private removeIfInactive() {
    if (!this.isActive) {
      ACTIVE_TIMERS.delete(this)
    }
  }

  /**
   * Kills all active runners in the swarm.
   */
  public static disposeAll() {
    for (const timer of ACTIVE_TIMERS) {
      timer.dispose()
    }
    ACTIVE_TIMERS.clear()
  }

  // #endregion

}

export type TimerHandle = ReturnType<typeof setTimeout>

const ACTIVE_TIMERS: Set<DisposableTimer> = new Set()
