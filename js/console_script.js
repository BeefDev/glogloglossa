import { TerminationError } from "./language-internals/interpretter.js";
import { getTheme } from "./theme_script.js";

const console_ = document.querySelector('.console');

export const logTypes = {
    Output: "output",
    Input: "input",
    Error: "error",
    Misc: "misc"
};

export function clear() {
    console_.innerHTML = '';
    const placeholder = document.createElement('h3');
    placeholder.innerText = 'IO Console';
    placeholder.classList.add('placeholder');

    console_.append(placeholder);
}

export function removeInputs() {
    const inputs = [];
    for(let child of console_.children) {
        if(child.classList.contains("input")) {
            inputs.push(child);
        }
    }

    for(let input of inputs) {
        input.cancel();
        console_.removeChild(input);
    }
}

export function log(message, type) {
    message = message.toString();
    if(console_.childElementCount !== 0 && console_.children[0].tagName.toLowerCase() === 'h3') {
        console_.children[0].remove();
    }

    const logElement = document.createElement('li');
    logElement.innerText = message;
    logElement.classList.add(`log-${type}`);
    console_.append(logElement);
    logElement.scrollIntoView();
}

export function logStyled(message, styles = "") {
    message = message.toString();
    if(console_.childElementCount !== 0 && console_.children[0].tagName.toLowerCase() === 'h3') {
        console_.children[0].remove();
    }

    const logElement = document.createElement('li');
    logElement.innerText = message;
    logElement.style = styles;

    console_.append(logElement);
    logElement.scrollIntoView();
}

export function appendHorizontalDivider() {
    console_.append(document.createElement('hr'));
}

export function requestInput() {
    if(console_.childElementCount !== 0 && console_.children[0].tagName.toLowerCase() === 'h3') {
        console_.children[0].remove();
    }

    const inputElement = document.createElement('input');
    
    let rejectMethod;
    const inputPromise = new Promise((resolve, reject) => {
        rejectMethod = reject;
        inputElement.addEventListener('keypress', (e) => {
            if(e.key == 'Enter') {
                const content = inputElement.value;
                inputElement.remove();

                if(console_.childElementCount == 0) {
                    clear();
                }
                
                resolve(content);
            }
        })
    });

    inputElement.classList.add('input');
    inputElement.cancel = () => {
        rejectMethod(new TerminationError());
    }

    console_.append(inputElement);

    inputElement.focus();
    inputElement.scrollIntoView();
    return inputPromise;
}