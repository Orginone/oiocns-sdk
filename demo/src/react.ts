import { createElement as h, useState, useEffect } from "react";

import OrginoneSdk from "orginone.sdk";

export default function App() {
    const [user, updateUser] = useState("loading...");
    async function init() {
        const client = new OrginoneSdk({
            timeout: 3000
        });

        await client.init();
        const res = await client.actions.person.tokenInfo();
        updateUser(res.data.userInfo.name);
    }
    useEffect(() => {
        init();
    })
    return h("div",{}, [
        "User: " + user,
    ]);
}