import { initialize as initializeThemes, getThemeIndex } from './theme_script.js'
import { log, requestInput, appendHorizontalDivider, clear as clear_console, removeInputs, logTypes, logStyled } from './console_script.js'
import Lexer, { keywords, Token } from './language-internals/lexer.js';
import Parser from './language-internals/parser.js';
import Interpretter, { IOHandler } from './language-internals/interpretter.js';
import { CodeLocation, Compilable, initializeExtras, settings, updateCompilationButton } from './settings.js';
import { StatementsNode } from './language-internals/nodes.js';

const Range = ace.require('ace/range').Range;

const maximumFontSize = 40;
const minimumFontSize = 8;
let currentFontSize = 18;
let executing = false;

const executeButton = document.getElementById("execute-button");
const compileButton = document.getElementById('compile-button');
const debugButton = document.getElementById("debug-button");
const inputFileButton = document.getElementById("input-file-button");
const zoomInButton = document.getElementById('zoom-in-button');
const zoomOutButton = document.getElementById('zoom-out-button');

const openFileButton = document.getElementById("open-file-button");
const saveFileButton = document.getElementById("save-file-button");
const githubLinkButton = document.getElementById("github-link-button");
const mysteryButton = document.getElementById("mystery-button");

const codeEditor = ace.edit("editor-code");
codeEditor.commands.removeCommand("find");
setFontSize(currentFontSize);

ace.define('ace/mode/glogloglossa_highlight_rules', ['require', 'exports', 'module'], (require, exports, module) => {
    const oop = require('../lib/oop');
    const TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

    const GloGloGlossaHighlightRules = function() {
        const keywordsString = ([...keywords].reduce((string, keyword) => string += keyword + "|", "").slice(0,-1));
        const keywordMapper = this.createKeywordMapper({
            "keyword": keywordsString,
        }, "identifier", true);
    
        this.$rules = {
            "start" : [ {
                token : "string",
                regex : '".*?"'
            }, {
                token : "constant.numeric",
                regex : "[0-9]"
            }, {
                token : keywordMapper,
                regex : "[α-ωΑ-Ωa-zA-Z_][α-ωΑ-Ωa-zA-Z0-9_]*"
            }, {
                token : "keyword.operator",
                regex : "(\\+|\\-|\\*|\\\\|\\^)"
            }, {
                token : "text",
                regex : "\\s+"
            } ]
        };
    }

    oop.inherits(GloGloGlossaHighlightRules, TextHighlightRules);
    exports.GloGloGlossaHighlightRules = GloGloGlossaHighlightRules;
});

ace.define('ace/mode/glogloglossa', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/glogloglossa_highlight_rules'], (require, exports, module) => {
    const oop = require('../lib/oop');
    const TextMode = require('./text').Mode;
    const Tokenizer = require('../tokenizer').Tokenizer
    const GloGloGlossaHighlightRules = require('./glogloglossa_highlight_rules').GloGloGlossaHighlightRules;

    const Mode = function() {
        const highlighter = new GloGloGlossaHighlightRules();
        this.$tokenizer = new Tokenizer(highlighter.getRules());
        this.$keywordList = highlighter.$keywordList;
    }

    oop.inherits(Mode, TextMode);
    exports.Mode = Mode;
});

codeEditor.session.setMode("ace/mode/glogloglossa");

window.addEventListener('beforeunload', () => {
    const themeIndex = getThemeIndex();
    const code = codeEditor.getValue();
    const extras = Object.keys(settings.packages);
    
    window.localStorage.setItem("saved_theme", themeIndex);
    window.localStorage.setItem("saved_code", code);
    window.localStorage.setItem("saved_settings", extras);
})

if(localStorage.getItem("saved_theme") !== null) {
    initializeThemes(localStorage.getItem("saved_theme"));
} else {
    initializeThemes(0);
}

if(localStorage.getItem("saved_settings") !== null) {
    initializeExtras(localStorage.getItem("saved_settings"));
} else {
    initializeExtras([]);
}

if(localStorage.getItem("saved_code") !== null) {
    codeEditor.setValue(localStorage.getItem("saved_code"));
}

updateCompilationButton();

const ioHandler = new IOHandler(requestInput, (text) => log(text, logTypes.Input), (text) => log(text, logTypes.Output), (text) => log(text, logTypes.Error), (text, styles = "") => logStyled(text, styles));

function toggleExecuting() {
    executing = !executing;
    executeButton.classList.toggle("stop");

    if(executing) {
        executeButton.querySelector('.icon').innerHTML = '<i class="fa-solid fa-stop"></i>';
        executeButton.querySelector('.text').innerHTML = "Stop";
        codeEditor.setReadOnly(true);
    } else {
        executeButton.querySelector('.icon').innerHTML = '<i class="fa-solid fa-play"></i>';
        executeButton.querySelector('.text').innerHTML = "Execution";
        codeEditor.setReadOnly(false);
        removeInputs();
    }
}

function setFontSize(pixels) {
    document.querySelector(':root').style.setProperty('--console-font-size', `${pixels}px`);
    codeEditor.setFontSize(`${pixels}pt`);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function requestUpload(onUpload) {
    const input = document.createElement('input');
    input.type = "file";
    input.setAttribute("multiple", false);
    input.setAttribute("accept", "text/*");
    input.onchange = (() => onUpload(input.files));
    input.click();
    input.remove();
}

function workInProgress() {
    alert("Work in progress");
}

function displayError(error) {
    const markers = codeEditor.session.getMarkers();
    if(markers) {
        for(let key of Object.keys(markers)) {
            codeEditor.session.removeMarker(markers[key].id);
        }
    }

    if(!error.glogloglossa_error) {
        log("Αναπάντεχο σφάλμα προγράμματος, κοίτα στην κονσόλα devtools", logTypes.Error);
        console.error(error);
    } else {
        if(error.hasPosition()) {
            error.message = `Γραμμή ${error.position_start.row+1}: ${error.message}`
            codeEditor.session.addMarker(
                new Range(error.position_start.row, 0, error.position_end.row, 1),
                "error-line-hightlight",
                "fullLine"
            )
            
            codeEditor.session.addMarker(
                new Range(error.position_start.row, error.position_start.column, error.position_end.row, error.position_end.column),
                "error-hightlight"
            )
        }

        log(error.message, logTypes.Error); 
    }
}

inputFileButton.addEventListener('click', workInProgress);
debugButton.addEventListener('click', workInProgress);

compileButton.addEventListener('click', () => {
    if(executing) {
        toggleExecuting();
    }

    clear_console();
    const lexingResult = new Lexer(codeEditor.getValue()).make_tokens();
    if(lexingResult.error) {
        displayError(lexingResult.error);
        return;
    }

    if(settings.printTokensEnabled) {
        log(lexingResult.tokens, logTypes.Misc);
        appendHorizontalDivider();
    }

    const parseResult = new Parser(lexingResult.tokens).parse();
    if(parseResult.error) {
        displayError(parseResult.error);
        return;
    }

    if(settings.printASTEnabled) {
        const nodes = [];
        for(let extrasPackage of Object.values(settings.packages)) {
            for(let extra of extrasPackage.extras) {
                nodes.push(extra.node);
            }
        }

        nodes.push(parseResult.node);
        log(new StatementsNode(nodes), logTypes.Misc);
        appendHorizontalDivider();
    }

    let text = codeEditor.getValue();

    for(let extrasPackage of Object.values(settings.packages)) {
        for(let extra of extrasPackage.extras) {
            if(extra.compilable === Compilable.TRUE && extra.isUsed(lexingResult.tokens)) {
                const result = extra.compilationResult;
                if(result.location === CodeLocation.BELOW) {
                    text += "\n";
                    text += result.text;
                }
            }
        }
    }

    download("glogloglossa.glo", text);
});

executeButton.addEventListener('click', () => {
    toggleExecuting();

    if(!executing) {
        return;
    }

    clear_console();
    const lexingResult = new Lexer(codeEditor.getValue()).make_tokens();
    if(lexingResult.error) {
        displayError(lexingResult.error);
        toggleExecuting();
        return;
    }

    if(settings.printTokensEnabled) {
        log(lexingResult.tokens, logTypes.Misc);
        appendHorizontalDivider();
    }

    if(lexingResult.tokens.length === 1) {
        toggleExecuting();
        return;
    }

    const parseResult = new Parser(lexingResult.tokens).parse();
    if(parseResult.error) {
        displayError(parseResult.error);
        toggleExecuting();
        return;
    }

    if(settings.printASTEnabled) {
        log(parseResult.node, logTypes.Misc);
        appendHorizontalDivider();
    }

    const nodes = [];
    for(let extrasPackage of Object.values(settings.packages)) {
        for(let extra of extrasPackage.extras) {
            nodes.push(extra.node);
        }
    }

    nodes.push(parseResult.node);
    new Interpretter(ioHandler, new StatementsNode(nodes)).execute(toggleExecuting).catch(error => {
        displayError(error);
        toggleExecuting();
    });
});

zoomInButton.addEventListener('click', () => {
    if(currentFontSize < maximumFontSize) {
        currentFontSize++;
        setFontSize(currentFontSize);
    }
});

zoomOutButton.addEventListener('click', () => {
    if(currentFontSize > minimumFontSize) {
        currentFontSize--;
        setFontSize(currentFontSize);
    }
});

mysteryButton.addEventListener('click', () => window.open("https://www.youtube.com/watch?v=f9qgAOi9Q9E&t=0s", "_blank"));
githubLinkButton.addEventListener('click', () => window.open("https://github.com/BeefDev/glogloglossa", "_blank"));
saveFileButton.addEventListener('click', () => {
    download("glogloglossa.glo", codeEditor.getValue())
});

openFileButton.addEventListener('click', () => {
    requestUpload((files) => {
        if(files.length === 0) {
            return;
        }

        const reader = new FileReader();
        const file = files[0];
        reader.addEventListener('load', (event) => {
            codeEditor.setValue(event.target.result);
        });

        reader.readAsText(file, 'UTF-8');
    })
});

codeEditor.addEventListener('focus', () => {
    const markers = codeEditor.session.getMarkers();
    if(markers) {
        for(let key of Object.keys(markers)) {
            codeEditor.session.removeMarker(markers[key].id);
        }
    }
});