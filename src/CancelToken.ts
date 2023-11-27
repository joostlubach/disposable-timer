export default class CancelToken {

  private canceled: boolean = false

  public get isCanceled() {
    return this.canceled
  }

  public cancel() {
    this.canceled = true
  }

  public uncancel() {
    this.canceled = false
  }

  public await<T>(promise: PromiseLike<T> | T): Promise<T> {
    // Disable lint because we catch errors and cannot easily rewrite using async/await.
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const retval = await promise
        if (this.canceled) { return }
        resolve(retval)
      } catch (error: any) {
        if (this.canceled) {
          reject(error)
        }
      }
    })
  }

}
