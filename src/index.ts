import type { AxiosRequestConfig } from "axios";
import { InitOption } from "./InitOption";
import { AssetCloudResponseBody } from "./Response";

export interface RequestConfig extends AxiosRequestConfig {
    [key: string]: any;
}

/** SDK客户端类 */
export default class OrginoneSdk {
    private _timeout: number;
    private _accessToken: string;
    private _userId: string;
    private _spaceId: string;
    private _appId: string = "";
    private initialized = false;
    private messageQueue: {
        sendId: string;
        timer: any;
        resolve: (value: any) => void;
        reject: (value: any) => void;
    }[] = [];
    /** 订阅字典 */
    private subscribeDic: Record<string, Function> = {};
    

    get userId() {
        return this._userId;
    }
    get spaceId() {
        return this._spaceId;
    }
    get appId() {
        return this._appId;
    }

    readonly actions: {
        readonly [controller: string]: {
            readonly [method: string]: (config?: RequestConfig, ...args: any[]) => Promise<AssetCloudResponseBody>;
        }
    } = {};

    /**
     * 创建新SDK客户端实例
     * @param option 客户端配置
     */
    constructor(option: InitOption = {}) {
        this._timeout = option.timeout || 30000;
        this._accessToken = "";
        this._userId = "";
        this._spaceId = "";
        window.addEventListener("message", this.handleMessage);
        window.addEventListener('beforeunload', this.destroy)
    }


    /** 销毁SDK客户端，销毁后可重新初始化 */
    destroy() {
        window.removeEventListener("message", this.handleMessage);
        this.messageQueue.forEach((item) => {
            clearTimeout(item.timer)
        })
        Object.keys(this.subscribeDic).forEach((key) => {
            let keys = key.split('|')
            if (keys.length === 3) {
                switch (keys[0]) {
                    case "object":
                        this.unSubscribed(keys[1], keys[2])
                        break
                    case "collection":
                        this.unSubscribe(keys[1], keys[2])
                        break
                }
            }
        })
        this.subscribeDic = {};
        this.messageQueue = [];
    }

    /** 初始化方法 */
    async init() {
        let res = await this._send<AssetCloudResponseBody>("actions", {})
        await this.initAction(this.actions, res.data, "")
        
        const app = await this.getAppInfo();
        this.initialized = true;
        return app;
    }

    /**
     * 获取当前应用信息
     */
    async getAppInfo() {
        let res = await this._send<AssetCloudResponseBody>("appInfo", {})
        if (res.success && res.data) {
            this._appId = res.data.id;
            return res;
        }
    }

    /**
     * 加载可用方法
     */
    private async initAction(req: any, urls: any, url: string) {
        Object.keys(urls).forEach((key) => {
            let sub = urls[key]
            let subUrl = url + ((url && url.length > 0) ? "." : "") + key
            switch (typeof (sub)) {
                case "string":
                    req[key] = async (options: RequestConfig = {}, ...args: any) => {
                        let token = await this.getTokenInfo();
                        options.headers ||= {};
                        options.headers['Authorization'] = token;
                        return await this._send(subUrl, options, args);
                    }
                    break
                case "object":
                    req[key] = {}
                    this.initAction(req[key], sub, subUrl)
                    break
                default:
                    throw new Error("Configuration not supported.")
            }
        })
    }
    /**
     * 获取应用token
     * @returns 返回授权token
     */
    private async getTokenInfo() {
        if (this._accessToken == "") {
            let res = await this._send<AssetCloudResponseBody>("person.createAPPtoken", {
                data: {
                    appId: this._appId,
                    funcAuthList: []
                }
            })
            if (res.success) {
                let { accessToken, spaceId, userId } = res.data
                this._accessToken = accessToken
                this._spaceId = spaceId
                this._userId = userId
            }
        }
        return this._accessToken
    }

    /**
     * 向平台发送消息
     * @param url 请求路径
     * @param options 请求参数
     * @param args 额外可边参数
     * @returns 异步等待
     */
    private _send<T>(url: string, options: RequestConfig, ...args: any) {
        return new Promise<T>((resolve, reject) => {
            let sendId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            this.messageQueue.push({
                sendId,
                resolve,
                reject,
                timer: setTimeout(() => {
                    this.messageQueue = this.messageQueue.filter((i) => i.sendId !== sendId)
                    reject({ data: {}, success: false, msg: "平台响应超时." })
                }, this._timeout)
            });
            window.top?.postMessage({
                url: url,
                options: options,
                sendId: sendId,
                args: args,
            }, "*");
        });
    }
    /** 
     * 接收平台消息
     * @param e 接收事件
     */
    private handleMessage = (e: MessageEvent) => {
        if (e.data) {
            switch (e.data.from) {
                case "orginone":
                    {
                        let { sendId, exception } = e.data
                        let item: any = this.messageQueue.find((i) => i.sendId === sendId)
                        if (item) {
                            clearTimeout(item.timer)
                            if (exception) {
                                item.reject(exception)
                            } else {
                                delete e.data.sendId
                                delete e.data.exception
                                delete e.data.from
                                item.resolve(e.data)
                            }
                            this.messageQueue = this.messageQueue.filter((i) => i.sendId !== sendId)
                        }
                    }
                    break
                case "online":
                    {
                        let { fullKey, data } = e.data
                        if (this.subscribeDic[fullKey]) {
                            this.subscribeDic[fullKey](data)
                        }
                    }
                    break
            }
        }
    }
    /**
     * 订阅集合变更
     * @param collName 集合名
     * @param domain 集合所在的域
     */
    async subscribe(collName: string, domain: string, callback: Function) {
        let fullKey = "collection" + '|' + collName + '|' + domain
        if (!this.subscribeDic[fullKey]) {
            let res = await this._send<any>("subscribe", { collName, domain }, fullKey)
            if (res.success) {
                this.subscribeDic[fullKey] = callback
                return true
            }
        }
        return false
    }
    /**
     * 订阅对象变更
     * @param objectName 对象名
     * @param domain 对象所在的域
     */
    async subscribed(objectName: string, domain: string, callback: Function) {
        let fullKey = "object" + '|' + objectName + '|' + domain
        if (!this.subscribeDic[fullKey]) {
            let res = await this._send<any>("subscribed", { objectName, domain }, fullKey)
            if (res.success) {
                this.subscribeDic[fullKey] = callback
            }
        }
    }
    /**
     * 取消订阅集合变更
     * @param collName 集合名
     * @param domain 集合所在的域
     */
    async unSubscribe(collName: string, domain: string) {
        let fullKey = "collection" + '|' + collName + '|' + domain
        if (this.subscribeDic[fullKey]) {
            let res: any = await this._send("unSubscribe", { collName, domain })
            if (res.success) {
                delete this.subscribeDic[fullKey]
                return true
            }
        }
        return false
    }
    /**
     * 取消订阅对象变更
     * @param objectName 对象名
     * @param domain 对象所在的域
     */
    async unSubscribed(objectName: string, domain: string) {
        let fullKey = "object" + '|' + objectName + '|' + domain
        if (this.subscribeDic[fullKey]) {
            let res: any = await this._send("unSubscribed", { objectName, domain })
            if (res.success) {
                delete this.subscribeDic[fullKey]
                return true
            }
        }
        return false
    }
}
