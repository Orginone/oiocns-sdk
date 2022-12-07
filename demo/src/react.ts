import React, { useState, useEffect } from "react";

import OrginoneSdk from "orginone.sdk";

function App(props: Record<string ,any>) {
    const h = React.createElement;

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
export default App;