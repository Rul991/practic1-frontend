import type z from "zod"
import { configSchema } from "../../schemas/config"
import type { ZodType } from "zod"
import JsonUtils from "../string/JsonUtils"

type ConfigObject = z.infer<typeof configSchema>
type ConfigKey = keyof ConfigObject

export default class Config {
    private static readonly _storageKey = 'surveys-config'

    private static readonly _schema: ZodType<ConfigObject> = configSchema
    private static _config: ConfigObject | undefined = undefined

    private static _parse(): ConfigObject {
        const raw = localStorage.getItem(this._storageKey) ?? 'null'
        const value = JsonUtils.parse(raw, this._schema) ?? {
            baseUrl: '/',
        }
        return this._config = value
    }

    static getFull(): ConfigObject {
        if(this._config === undefined) {
            return this._parse()
        }

        return this._config
    }

    static update(config: Partial<ConfigObject>): ConfigObject {
        const currentConfig = this.getFull()
        const newConfig = {
            ...currentConfig,
            ...config
        }

        this._config = newConfig
        localStorage.setItem(
            this._storageKey,
            JSON.stringify(newConfig)
        )

        return this._config
    }

    static get<K extends ConfigKey>(key: K): ConfigObject[K] {
        const config = this.getFull()
        return config[key]
    }

    static set<K extends ConfigKey>(key: K, value: ConfigObject[K]): ConfigObject {
        return this.update({
            [key]: value
        })
    }
}