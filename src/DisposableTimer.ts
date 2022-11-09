import config from './config'

const activeTimers: Set<DisposableTimer> = new Set()

export default class DisposableTimer {

  private disposed = false

  public get isDisposed() {
    return this.disposed
  }

  private timeouts: Set<NodeJS.Timer> = new Set()

  /**
   * Determines if this timer is currently active, i.e. there are active timeouts.
   */
  public get isActive() {
    return this.timeouts.size > 0
  }

  /**
   * Queues a task like `setTimeout`, but makes sure this task is canceled if this runner is disposeed.
   * The given callback is executed with the runner as `this`.
   *
   * @param callback The callback to execute.
   * @param ms       The amount of milliseconds to wait.
   * @returns        A promise with the return value of the callback. Note that if the runner is disposeed,
   *                 this promise is never resolved or rejected!
   */
  public setTimeout<T>(callback: () => T | Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.disposed) { return }

      const timeout = setTimeout(async () => {
        this.timeouts.delete(timeout)
        this.removeIfInactive()

        try {
          const retval = await callback.call(this)
          resolve(retval)
        } catch (error: any) {
          reject(error)
        }
      }, ms)

      this.timeouts.add(timeout)
      activeTimers.add(this)
    })
  }

  public clearTimeouts() {
    if (this.timeouts.size === 0) { return }

    for (const timeout of this.timeouts) {
      clearTimeout(timeout)
    }
    this.timeouts.clear()

    activeTimers.delete(this)
  }

  public removeIfInactive() {
    if (!this.isActive) {
      activeTimers.delete(this)
    }
  }

  /**
   * Kills all outstanding tasks of this runner.
   */
  public dispose() {
    this.clearTimeouts()
    this.disposed = true
  }

  /**
   * Kills all active runners in the swarm.
   */
  public static disposeAll() {
    config.logger.debug("Received dispose signal, shutting down all timers...", {
      count: activeTimers.size,
    })

    for (const timer of activeTimers) {
      timer.dispose()
    }
  }

}