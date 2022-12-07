import { createApp } from "vue";
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

import VueApp from "./vue";
import ReactApp from "./react";

(() => {

const root = document.querySelector<HTMLElement>("#app");
if (window.top == self) {
    root.innerText = "请在平台内使用SDK！";
    return;
}

function selectFramework(type: "vue" | "react") {
    if (type == "vue") {
        const vue = createApp(VueApp);
        vue.mount(root);
    } else {
        const react = createRoot(root);
        react.render(createElement(ReactApp));
    }
}

const btnVue = document.querySelector<HTMLButtonElement>("#btn_vue");
const btnReact = document.querySelector<HTMLButtonElement>("#btn_react");

btnVue.onclick = () => selectFramework("vue");
btnReact.onclick = () => selectFramework("react");

})();
