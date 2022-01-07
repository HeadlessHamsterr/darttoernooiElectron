const path = require('path');
const url = require('url');
const customTitlebar = require('custom-electron-titlebar');
const { Themebar } = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#1C1B22'),
        icon: url.format(path.join(__dirname, '/icons/appIcon.png')),
        menu: false,
        enableMnemonics: false,
        shadow: true
    });

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if(element){
            element.innerText = text;
        }
    }

    for(const type of ['chrome', 'node', 'electron']){
        replaceText(`${type}-version`, process.versions[type])
    }
})