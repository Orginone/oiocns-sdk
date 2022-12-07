import { defineComponent, h, ref, onMounted } from "vue";

import OrginoneSdk from "orginone.sdk";

export default defineComponent({ setup() {
    const user = ref("loading...");
    async function init() {
        const client = new OrginoneSdk({
            timeout: 3000
        });

        await client.init();
        const res = await client.actions.person.tokenInfo();
        user.value = res.data.userInfo.name;
    }
    onMounted(() => {
        init();
    });
    return () => {
        return h("div", {}, [
            "User: " + user.value
        ]);
    }
}});