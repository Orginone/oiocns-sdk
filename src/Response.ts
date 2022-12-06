export type AssetCloudResponseBody<T = any> = {
    code: number,
    success: boolean,
    msg: string,
    data: T
};