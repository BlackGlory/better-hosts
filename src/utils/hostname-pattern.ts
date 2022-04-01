export class HostnamePattern {
  public readonly negative: boolean
  private re: RegExp

  constructor(pattern: string) {
    if (pattern.startsWith('-')) {
      this.negative = true
      pattern = pattern.slice(1)
    } else {
      this.negative = false
    }

    const re = pattern.replace(/\./g, '\\.')
                      .replace(/\*/g, '.*')
    this.re = new RegExp(`^${re}$`, 'i')
  }

  match(hostname: string): boolean {
    return this.re.test(hostname)
  }
}
