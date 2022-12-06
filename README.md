## 奥集能前端 SDK

![npm](https://img.shields.io/npm/v/orginone.sdk?color=green)


### 注意：
<div style="color:red">
<ul>
<li>SDK请在平台上架应用后在平台内打开进行调用，直接使用无效！</li>
<li>使用前请先了解ES6相关知识，包括<c>Promise</c>的用法以及await的使用条件</li>
</ul>
</div>

奥集能前端SDK，利用postMessage进行跨iframe的安全数据请求。授权后，可以访问平台相关的各类接口与服务。

SDK采用TypeScript开发，采用npm包引入可以自动获得完善的类型定义和代码自动补全。
### 快速开始

1. 引入和初始化

    可以使用ES7 `async/await` 语法简化异步调用
    ```javascript
    import OrginoneSdk from "orginone.sdk";
    // ...

    // 创建时提供传入初始化配置，可以不传
    const client = new OrginoneSdk({
        timeout: 60000
    });
    // 等待初始化完成
    const appInfo = await client.init();
    ```

2. 调用平台接口

    所有可用接口均放在`actions`中。
 
    返回`Promise`，如果平台返回值的`success`字段为`false`，会自动触发reject。
 
    ```javascript
    try {
     // 获取用户的tokenInfo
      const res = await client.actions.person.tokenInfo();
      const tokenInfo = res.data;
      console.log(tokenInfo);
    } catch (error) {
      console.error(error);
    }
    ```
