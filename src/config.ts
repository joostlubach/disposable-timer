import { merge } from 'lodash'

export interface Config {
  logger: Logger
}

export interface Logger {
  debug: (message: string, ...meta: any[]) => void
  info:  (message: string, ...meta: any[]) => void
  warn:  (message: string, ...meta: any[]) => void
  error: (message: string, ...meta: any[]) => void
}


const config: Config = {
  logger: console,
}

export default config

export function configure(cfg: Partial<Config>) {
  merge(config, cfg)
}