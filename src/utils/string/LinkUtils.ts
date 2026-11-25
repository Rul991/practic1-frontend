import Config from "../config/Config"

export default class LinkUtils {
    static getShowable(link: string): string {
        const rawBaseUrl = Config.get('baseUrl')
        const origin = window.location.origin
        const baseUrl = rawBaseUrl.length <= 1 ?
            origin :
            rawBaseUrl

        const fullUrl = `${baseUrl}/s/${link}`
        return fullUrl
    }
}