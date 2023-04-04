import { initializeDropdown, addSelectionListener } from "./dropdown_script.js";

const themeProperties = [
    "--logo-color",
    "--console-placeholder-color",
    "--console-separator-color",
    "--console-input-field-color",
    "--console-background-color",
    "--header-background-color",
    "--execute-button-color",
    "--execute-button-background-color", 
    "--execute-button-hover-color",
    "--execute-button-hover-background-color",
    "--stop-button-color",
    "--stop-button-background-color",
    "--stop-button-hover-color",
    "--stop-button-hover-background-color",
    "--button-color",
    "--button-background-color",
    "--button-hover-color",
    "--button-hover-background-color",
    "--button-zoom-hover-color",
    "--button-zoom-hover-background-color",
    "--dropdown-select-color",
    "--dropdown-select-background-color",
    "--dropdown-select-border-color",
    "--dropdown-select-hover-color",
    "--dropdown-select-hover-background-color",
    "--dropdown-menu-color",
    "--dropdown-menu-background-color",
    "--dropdown-menu-border-color",
    "--dropdown-menu-hover-color",
    "--dropdown-menu-hover-background-color",
    "--dropdown-menu-active-color",
    "--dropdown-menu-active-background-color",
    "--enabled-option-color",
    "--disabled-option-color",
    "--error-highlight-color",
    "--error-line-highlight-color",
    "--active-compile-button-color",
    "--semi-active-compile-button-color",
    "--active-compile-button-background-color",
    "--semi-active-compile-button-background-color",
    "--log-output-color",
    "--log-input-color",
    "--log-error-color",
    "--log-misc-color"
];

function adjustColorBrightness(color, percent) {
    var num = parseInt(color.replace("#",""),16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    B = (num >> 8 & 0x00FF) + amt,
    G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
};

const defaultLightProperties = {
    primaryColor: "#ffffff",
    secondaryColor: "#000000",
    specialButtonTextColor: "#ffffff",
    executeAndCompileButtonColor: "#07d400",
    stopButtonColor: "#e30000",
    compileButtonSemiFunctionalColor: "#e38400",
    enabledOptionColor: "#21c700",
    disabledOptionColor: "#f50000",
    errorHightlightColor: "#ff0000",
    errorHightlightLineColor: "rgba(181, 169, 0, 0.5)",
    consoleSeparatorColor: "#6b6b6b",
    consolePlaceholderColor: "#999999",
    consoleInputFieldColor: "#d68f00",
    consoleErrorLogColor: "red",
    consoleMiscLogColor: "blue"
};

const defaultDarkProperties = {
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    specialButtonTextColor: "#ffffff",
    executeAndCompileButtonColor: "#07d400",
    stopButtonColor: "#e30000",
    compileButtonSemiFunctionalColor: "#e38400",
    enabledOptionColor: "#21c700",
    disabledOptionColor: "#f50000",
    errorHightlightColor: "#ff0000",
    errorHightlightLineColor: "rgba(181, 169, 0, 0.5)",
    consoleSeparatorColor: "#6b6b6b",
    consolePlaceholderColor: "#999999",
    consoleInputFieldColor: "#d68f00",
    consoleErrorLogColor: "red",
    consoleMiscLogColor: "blue"
};

export class Theme {
    constructor(name, isDark = false, properties = {}, ace_theme = "", cssProperties = {}) {
        const {
            primaryColor = (isDark ? defaultDarkProperties.primaryColor : defaultLightProperties.primaryColor), 
            secondaryColor = (isDark ? defaultDarkProperties.secondaryColor : defaultLightProperties.secondaryColor), 
            specialButtonTextColor = (isDark ? defaultDarkProperties.specialButtonTextColor : defaultLightProperties.specialButtonTextColor),
            executeAndCompileButtonColor = (isDark ? defaultDarkProperties.executeAndCompileButtonColor : defaultLightProperties.executeAndCompileButtonColor), 
            stopButtonColor = (isDark ? defaultDarkProperties.stopButtonColor : defaultLightProperties.stopButtonColor), 
            compileButtonSemiFunctionalColor = (isDark ? defaultDarkProperties.compileButtonSemiFunctionalColor : defaultLightProperties.compileButtonSemiFunctionalColor), 
            enabledOptionColor = (isDark ? defaultDarkProperties.enabledOptionColor : defaultLightProperties.enabledOptionColor), 
            disabledOptionColor = (isDark ? defaultDarkProperties.disabledOptionColor : defaultLightProperties.disabledOptionColor), 
            errorHightlightColor = (isDark ? defaultDarkProperties.errorHightlightColor : defaultLightProperties.errorHightlightColor), 
            errorHightlightLineColor = (isDark ? defaultDarkProperties.errorHightlightLineColor : defaultLightProperties.errorHightlightLineColor), 
            consoleSeparatorColor = (isDark ? defaultDarkProperties.consoleSeparatorColor : defaultLightProperties.consoleSeparatorColor), 
            consolePlaceholderColor = (isDark ? defaultDarkProperties.consolePlaceholderColor : defaultLightProperties.consolePlaceholderColor), 
            consoleInputFieldColor = (isDark ? defaultDarkProperties.consoleInputFieldColor : defaultLightProperties.consoleInputFieldColor),
            consoleErrorLogColor = (isDark ? defaultDarkProperties.consoleErrorLogColor : defaultLightProperties.consoleErrorLogColor),
            consoleMiscLogColor = (isDark ? defaultDarkProperties.consoleMiscLogColor : defaultLightProperties.consoleMiscLogColor)
        } = properties;

        this.name = name;
        this.properties = properties
        this.ace_theme = ace_theme;
        this.cssProperties = {
            "--logo-color": secondaryColor,
            "--console-placeholder-color": consolePlaceholderColor,
            "--console-separator-color": consoleSeparatorColor,
            "--console-input-field-color": consoleInputFieldColor,
            "--console-background-color": primaryColor,
            "--header-background-color": primaryColor,
            "--execute-button-color": specialButtonTextColor,
            "--execute-button-background-color": executeAndCompileButtonColor,
            "--execute-button-hover-color": specialButtonTextColor,
            "--execute-button-hover-background-color": executeAndCompileButtonColor,
            "--stop-button-color": specialButtonTextColor,
            "--stop-button-background-color": stopButtonColor,
            "--stop-button-hover-color": specialButtonTextColor,
            "--stop-button-hover-background-color": stopButtonColor,
            "--button-color": secondaryColor,
            "--button-background-color": primaryColor,
            "--button-hover-color": primaryColor,
            "--button-hover-background-color": secondaryColor,
            "--button-zoom-hover-color": secondaryColor,
            "--button-zoom-hover-background-color": primaryColor,
            "--dropdown-select-color": secondaryColor,
            "--dropdown-select-background-color": primaryColor,
            "--dropdown-select-border-color": secondaryColor,
            "--dropdown-select-hover-color": primaryColor,
            "--dropdown-select-hover-background-color": secondaryColor,
            "--dropdown-menu-color": secondaryColor,
            "--dropdown-menu-background-color": primaryColor,
            "--dropdown-menu-border-color": secondaryColor,
            "--dropdown-menu-hover-color": secondaryColor,
            "--dropdown-menu-hover-background-color": adjustColorBrightness(primaryColor, isDark ? 20 : -20),
            "--dropdown-menu-active-color": secondaryColor,
            "--dropdown-menu-active-background-color": adjustColorBrightness(primaryColor, isDark ? 30 : -30),
            "--enabled-option-color": enabledOptionColor,
            "--disabled-option-color": disabledOptionColor,
            "--error-highlight-color": errorHightlightColor,
            "--error-line-highlight-color": errorHightlightLineColor,
            "--active-compile-button-color": specialButtonTextColor,
            "--semi-active-compile-button-color": specialButtonTextColor,
            "--active-compile-button-background-color": executeAndCompileButtonColor,
            "--semi-active-compile-button-background-color": compileButtonSemiFunctionalColor,
            "--log-output-color": secondaryColor,
            "--log-input-color": consoleInputFieldColor,
            "--log-error-color": consoleErrorLogColor,
            "--log-misc-color": consoleMiscLogColor
        };

        for(let key of Object.keys(cssProperties)) {
            this.cssProperties[key] = cssProperties[key];
        }
    }
};

const themes = Object.freeze([
    new Theme("BeefDev | Light", false, defaultLightProperties, "ace/theme/chrome"),
    new Theme("BeefDev | Dark", true, defaultDarkProperties, "ace/theme/merbivore"),
    new Theme("BeefDev | Dracula", true, {
        primaryColor: "#282a36",
        secondaryColor: "#f8f8f2",
        executeAndCompileButtonColor: "#50fa7b",
        compileButtonSemiFunctionalColor: "#ffb86c",
        consolePlaceholderColor: "#bd93f9",
        consoleInputFieldColor: "#6272a4",
        stopButtonColor: "#ff5555",
        consoleMiscLogColor: "#bd93f9",
        errorHightlightLineColor: "#ffb86c",
        consoleErrorLogColor: "#ff5555"
    }, "ace/theme/dracula"),
    new Theme("BeefDev | Gob", true, {
        primaryColor: "black",
        secondaryColor: "#b2f5ab",
        executeAndCompileButtonColor: "#2ff762",
        compileButtonSemiFunctionalColor: "#ffae2b",
        consolePlaceholderColor: "#2ff762",
        consoleInputFieldColor: "#2ff762",
        stopButtonColor: "#ff5555",
        consoleMiscLogColor: "#00c79c",
        consoleErrorLogColor: "#ff5555"
    }, "ace/theme/gob"),
    new Theme("BeefDev | One Dark", true, {
        primaryColor: "#282c34",
        secondaryColor: "#abb2bf",
        stopButtonColor: "#e06c75",
        executeAndCompileButtonColor: "#98c379",
        compileButtonSemiFunctionalColor: "#d19a66",
        errorHightlightLineColor: "#e06c75",
        consoleErrorLogColor: "#be5046",
        consoleMiscLogColor: "#61afef",
        disabledOptionColor: "#e06c75",
        enabledOptionColor: "#98c379",
        consoleInputFieldColor: "#e5c07b"
    }, "ace/theme/one_dark"),
    new Theme("Mom | Dark", true, {
        secondaryColor: "#03a9fc",
        errorHightlightLineColor: "rgb(255, 125, 125,0.5)",
        compileButtonSemiFunctionalColor: "#03a9fc",
        consolePlaceholderColor: "#03a9fc",
        consoleErrorLogColor: "#ff0000",
        consoleMiscLogColor: "blue",
        consoleInputFieldColor: "#00c8ff"
    }, "ace/theme/chaos"),
    new Theme("Mom | Light", false, {
        secondaryColor: "#0070a8",
        errorHightlightLineColor: "rgb(255, 125, 125,0.5)",
        compileButtonSemiFunctionalColor: "#0070a8",
        consolePlaceholderColor: "#0070a8",
        consoleErrorLogColor: "#ff0000",
        consoleMiscLogColor: "blue",
        consoleInputFieldColor: "#00c8ff"
    }),
    new Theme("Joanna | Monokai", true, {
        primaryColor: "#1b1c18",
        secondaryColor: "#d5bb6d",
        executeAndCompileButtonColor: "#ffa83d",
        stopButtonColor: "#b01932",
        compileButtonSemiFunctionalColor: "#db254a",
        consolePlaceholderColor: "#d5bb6d",
        consoleErrorLogColor: "#b01932",
        errorHightlightLineColor: "#697055",
        consoleMiscLogColor: "#8968ed"
    }, "ace/theme/monokai")
]);

let selectedThemeIndex;

export function applyTheme(theme) {
    const cssVariables = document.querySelector(':root').style;
    const cssProperties = theme.cssProperties;
    themeProperties.forEach(property => {
        cssVariables.setProperty(property, cssProperties[property]);
    });

    ace.edit("editor-code").setTheme(theme.ace_theme);
}

export function getThemes() {
    return themes;
}

export function getTheme() {
    return themes[selectedThemeIndex];
}

export function getThemeIndex() {
    return selectedThemeIndex;
}

export function initialize(selected) {
    if(selected == undefined || selected < 0 || selected >= themes.length) {
        selected = 0;
    }
    
    selectedThemeIndex = selected;
    applyTheme(themes[selected]);

    const themeSelector = document.getElementById("theme-selector");
    const menu = themeSelector.querySelector(".menu");
    menu.innerHTML = '';

    themeSelector.querySelector(".selected").innerText = getTheme().name;

    for(let i = 0; i<themes.length; i++) {
        const theme = themes[i];
        const li = document.createElement('li');

        li.dataset.themeIndex = i;
        li.innerText = theme.name;
        if(i == selected) {
            li.classList.add('active');
        }

        menu.append(li);
    }

    initializeDropdown(themeSelector)
    addSelectionListener(themeSelector, (selected) => {
        const theme = themes[selected.dataset.themeIndex]
        selectedThemeIndex = selected.dataset.themeIndex;
        applyTheme(theme, selected.dataset.themeIndex);
    });
}