import { addSelectionListener, initializeDropdown } from "./dropdown_script.js";
import { FunctionCallNode, NativeNode, StatementsNode } from "./language-internals/nodes.js";
import { SymbolTypes, SymbolTableNativeExecutableEntryData, SymbolTableFunctionEntryData, ValueType, SymbolTableCheckedNativeFunctionData, TypedValue, SymbolTableCheckedNativeProcessData } from "./language-internals/interpretter.js";
import Lexer, { Error, Token, TokenType } from "./language-internals/lexer.js";
import Parser from "./language-internals/parser.js";

const activePackages = {};

export const settings = {
    printTokensEnabled: false,
    printASTEnabled: false,
    packages: activePackages
};

export const Compilable = {
    FALSE: "FALSE",
    PARTIALLY: "PARTIALLY",
    TRUE: "TRUE",
    EXCLUDED: "EXCLUDED"
};

export const CodeLocation = {
    BELOW: 0,
    VARIABLE_DECLARATIONS: 1
};

const printTokensOptionButton = document.getElementById("print-tokens-option-button");
const printASTOptionButton = document.getElementById("print-ast-option-button");

function togglePrintTokens() {
    settings.printTokensEnabled = !settings.printTokensEnabled;
    printTokensOptionButton.classList.toggle("enabled");
}

function togglePrintAST() {
    settings.printASTEnabled = !settings.printASTEnabled;
    printASTOptionButton.classList.toggle("enabled");
}

printTokensOptionButton.addEventListener('click', togglePrintTokens);
printASTOptionButton.addEventListener('click', togglePrintAST);

class ExtrasPackage {
    constructor(name, extras, enabledByDefault = false) {
        this.name = name;
        this.extras = extras;
        this.enabledByDefault = enabledByDefault;

        const countedExtras = [];
        for(let extra of this.extras) {
            if(extra.compilable !== Compilable.EXCLUDED) countedExtras.push(extra);
        }

        this.compilable = countedExtras.length === 0 ? Compilable.EXCLUDED : countedExtras.every(extra => extra.compilable === Compilable.FALSE) ? Compilable.FALSE : countedExtras.some(extra => extra.compilable === Compilable.FALSE) ? Compilable.PARTIALLY : Compilable.TRUE; 
    }
}

class NativeExtra {
    constructor(callable, needsCompilation = true) {
        this.node = new NativeNode(callable);
        this.compilable = needsCompilation ? Compilable.FALSE : Compilable.EXCLUDED;
    }

    isUsed() {
        return false;
    }
};

class RegistrationExtra extends NativeExtra {
    constructor(identifier, type, data, needsCompilation = true) {
        super((ioHandler, symbolTable) => {
            symbolTable.registerWithString(identifier, type, data, true);
        }, needsCompilation);
    }

    isUsed() {
        return false;
    }
}

class WrittenExtra {
    constructor(code, tokenMatcher) {
        this.tokenMatcher = tokenMatcher;

        this.compilable = Compilable.TRUE;
        this.compilationResult = {location: CodeLocation.BELOW, text:code};
        
        const tokens = new Lexer(code).make_tokens().tokens;
        const node = new Parser(tokens).parse(false).node;

        console.log(new Parser(tokens).parse(false).error);

        console.log(tokens);
        console.log(node);
        this.node = node;
    }

    isUsed(tokens) {
        return tokens.some(token => this.tokenMatcher(token));
    }
};

const packages = {
    "default": new ExtrasPackage("default", 
        [
            new RegistrationExtra("ΗΜ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.sin(args[0].value), ValueType.REAL, [ValueType.REAL], "ΗΜ"), false),
            new RegistrationExtra("ΣΥΝ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.cos(args[0].value), ValueType.REAL, [ValueType.REAL], "ΣΥΝ"), false),
            new RegistrationExtra("ΕΦ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.tan(args[0].value), ValueType.REAL, [ValueType.REAL], "ΕΦ"), false),
            new RegistrationExtra("Τ_Ρ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.sqrt(args[0].value), ValueType.REAL, [ValueType.REAL], "Τ_Ρ"), false),
            new RegistrationExtra("Α_Μ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.trunc(args[0].value), ValueType.REAL, [ValueType.REAL], "Α_Μ"), false),
            new RegistrationExtra("Α_Τ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.abs(args[0].value), ValueType.REAL, [ValueType.REAL], "Α_Τ"), false),
            new RegistrationExtra("ΛΟΓ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.log(args[0].value), ValueType.REAL, [ValueType.REAL], "ΛΟΓ"), false),
            new RegistrationExtra("Ε", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((ioHandler, symbolTable, args) => Math.pow(Math.E, args[0].value), ValueType.REAL, [ValueType.REAL], "Ε"), false),
        ], true),
    "date_time": new ExtrasPackage("date_time", 
        [
            new RegistrationExtra("ΧΡΟΝΟΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getFullYear(), ValueType.INTEGER, [], "ΧΡΟΝΟΣ")),
            new RegistrationExtra("ΜΗΝΑΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getMonth()+1, ValueType.INTEGER, [], "ΜΗΝΑΣ")),
            new RegistrationExtra("ΜΕΡΑ_ΤΟΥ_ΜΗΝΑ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getDate(), ValueType.INTEGER, [], "ΜΕΡΑ_ΤΟΥ_ΜΗΝΑ")),
            new RegistrationExtra("ΜΕΡΑ_ΤΗΣ_ΕΒΔΟΜΑΔΑΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getDay(), ValueType.INTEGER, [], "ΜΕΡΑ_ΤΗΣ_ΕΒΔΟΜΑΔΑΣ")),
            new RegistrationExtra("ΩΡΑ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getHours(), ValueType.INTEGER, [], "ΩΡΑ")),
            new RegistrationExtra("ΛΕΠΤΟ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getMinutes(), ValueType.INTEGER, [], "ΛΕΠΤΟ")),
            new RegistrationExtra("ΔΕΥΤΕΡΟΛΕΠΤΟ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData(() => new Date().getSeconds(), ValueType.INTEGER, [], "ΔΕΥΤΕΡΟΛΕΠΤΟ")),
        ], false),
    "random": new ExtrasPackage("random", 
        [
            new RegistrationExtra("ΤΥΧΑΙΟΣ_ΑΚΕΡΑΙΟΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((a,b,args) => {
                const min = args[0].value;
                const max = args[1].value;

                if(min >= max) {
                    throw new Error("Η αριστέρη παράμετρος πρέπει να είναι μικρότερη από την δεξία");
                }

                return Math.floor(Math.random() * (max - min)) + min
            }, ValueType.INTEGER, [ValueType.INTEGER, ValueType.INTEGER], "ΤΥΧΑΙΟΣ_ΑΚΕΡΑΙΟΣ")),
            new RegistrationExtra("ΤΥΧΑΙΟΣ_ΠΡΑΓΜΑΤΙΚΟΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((a,b,args) => {
                const min = args[0].value;
                const max = args[1].value;

                if(min >= max) {
                    throw new Error("Η αριστέρη παράμετρος πρέπει να είναι μικρότερη από την δεξία");
                }

                return Math.random() * (max - min) + min;
            }, ValueType.REAL, [ValueType.REAL, ValueType.REAL], "ΤΥΧΑΙΟΣ_ΠΡΑΓΜΑΤΙΚΟΣ")),
            new RegistrationExtra("ΤΥΧΑΙΑ_ΛΟΓΙΚΗ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((a,b,args) => {
                const chances = args[0].value;
                if(chances < 0 || chances > 100) {
                    throw new Error("Η πιθανότητα πρέπει να είναι από 0 μέχρι 100");
                }

                return Math.random() < (chances / 100)
            }, ValueType.BOOLEAN, [ValueType.REAL], "ΤΥΧΑΙΑ_ΛΟΓΙΚΗ")),
            new RegistrationExtra("ΤΥΧΑΙΟΙ_ΧΑΡΑΚΤΗΡΕΣ", SymbolTypes.FUNCTION, new SymbolTableCheckedNativeFunctionData((a,b,args) => {
                const characters = args[0].value;
                if(characters <= 0) {
                    throw new Error("Η χαρακτήρες πρέπει να είναι θετικοί");
                }

                const legalCharacters = "αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ1234567890_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
                let string = '';
                for(let i = 0; i<characters; i++) {
                    string += legalCharacters.charAt(Math.floor(Math.random()*legalCharacters.length));
                }

                return string;
            },ValueType.STRING, [ValueType.INTEGER], "ΤΥΧΑΙΟΙ_ΧΑΡΑΚΤΗΡΕΣ")),
        ], false),
    "school_helpers": new ExtrasPackage("school_helpers", 
        [
            new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_2(s1,e1,s2,e2,p1,p2, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,p1,p2,i
ΑΡΧΗ
    ΑΝ i > e2 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_2 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_2 <- i * p1
    ΑΛΛΙΩΣ 
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_2 <- i * p2
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`,token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_2"),
            new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3(s1,e1,s2,e2,s3,e3,p1,p2,p3, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,p1,p2,p3,i
ΑΡΧΗ
    ΑΝ i > e3 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3 <- i * p2
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3 <- i * p3
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`,token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_3"),
            new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4(s1,e1,s2,e2,s3,e3,s4,e4,p1,p2,p3,p4, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,s4,e4,p1,p2,p3,p4,i
ΑΡΧΗ
    ΑΝ i > e4 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p2
    ΑΛΛΙΩΣ_ΑΝ i <= e3 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p3
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p4
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`,token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4"),
                new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_5(s1,e1,s2,e2,s3,e3,s4,e4,s5,p5,p1,p2,p3,p4,p5, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,s4,e4,s5,e5,p1,p2,p3,p4,p5,i
ΑΡΧΗ
    ΑΝ i > e4 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p2
    ΑΛΛΙΩΣ_ΑΝ i <= e3 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p3
    ΑΛΛΙΩΣ_ΑΝ i <= e4 ΤΟΤΕ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p4
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_4 <- i * p5
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`,token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΟΥΜΕΝΗ_ΧΡΕΩΣΗ_5"),
                new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_2(s1,e1,s2,e2,p1,p2, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,p1,p2,i
ΑΡΧΗ
    ΑΝ i > e2 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_2 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
    ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_2 <- i * p1
    ΑΛΛΙΩΣ 
    ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_2 <- e1 * p1 + (i - e1) * p2
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`, token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_2"),
                new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3(s1,e1,s2,e2,s3,e3,p1,p2,p3, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,p1,p2,p3,i
ΑΡΧΗ
    ΑΝ i > e3 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3 <- e1 * p1 + (i - e1) * p2
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3 <- (e1 * p1) + ((e2 - e1) * p2) + ((i - e2) * p3)
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`, token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_3"),
                new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4(s1,e1,s2,e2,s3,e3,s4,e4,p1,p2,p3,p4, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,s4,e4,p1,p2,p3,p4,i
ΑΡΧΗ
    ΑΝ i > e4 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4 <- e1 * p1 + (i - e1) * p2
    ΑΛΛΙΩΣ_ΑΝ i <= e3 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4 <- (e1 * p1) + ((e2 - e1) * p2) + ((i - e2) * p3)
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4 <- (e1 * p1) + ((e2 - e1) * p2) + ((e3 - e2) * p3) + ((i - e3) * p4)
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`, token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_4"),
                new WrittenExtra(
`ΣΥΝΑΡΤΗΣΗ ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5(s1,e1,s2,e2,s3,e3,s4,e4,s5,e5,p1,p2,p3,p4,p5, i): ΠΡΑΓΜΑΤΙΚΗ
ΜΕΤΑΒΛΗΤΕΣ
    ΠΡΑΓΜΑΤΙΚΕΣ: s1,e1,s2,e2,s3,e3,s4,e4,s5,e5,p1,p2,p3,p4,p5,i
ΑΡΧΗ
    ΑΝ i > e5 Η i < s1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- -1
    ΑΛΛΙΩΣ_ΑΝ i <= e1 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- i * p1
    ΑΛΛΙΩΣ_ΑΝ i <= e2 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- e1 * p1 + (i - e1) * p2
    ΑΛΛΙΩΣ_ΑΝ i <= e3 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- (e1 * p1) + ((e2 - e1) * p2) + ((i - e2) * p3)
    ΑΛΛΙΩΣ_ΑΝ i <= e4 ΤΟΤΕ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- (e1 * p1) + ((e2 - e1) * p2) + ((e3 - e2) * p3) + ((i - e3) * p4)
    ΑΛΛΙΩΣ
        ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5 <- (e1 * p1) + ((e2 - e1) * p2) + ((e3 - e2) * p3) + ((e4 - e3) * p4) + ((i - e4) * p5)
    ΤΕΛΟΣ_ΑΝ
ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ`, token => token.type === TokenType.IDENTIFIER && token.value === "ΚΛΙΜΑΚΩΤΗ_ΧΡΕΩΣΗ_5")
        ], false),
    "native": new ExtrasPackage("native", 
        [
            new RegistrationExtra("ΓΡΑΨΕ_ΜΕ_ΣΤΥΛ", SymbolTypes.PROCESS, new SymbolTableNativeExecutableEntryData((ioHandler, symbolTable, args) => {
                if(args.length < 2) {
                    throw new Error("Περίμενα τουλάχιστον 2 παραμέτρους");
                }

                const styles = args[0];
                if(args[0].type !== ValueType.STRING) {
                    throw new Error("Η πρώτη παράμετρος πρέπει να είναι " + ValueType.STRING);
                }

                let string = "";
                for(let i = 1; i<args.length; i++) {
                    const arg = args[i].value;

                    if(arg == null) {
                        throw new Error("Περίμενα κάποια τιμή");
                    }

                    string += arg + " ";
                }

                ioHandler.outputStyled(string, styles);
            }))
        ], false)
};

export function updateCompilationButton() {
    const compilationButton = document.getElementById('compile-button');
    const countedPackages = [];
    for(let extra of Object.values(settings.packages)) {
        if(extra.compilable !== Compilable.EXCLUDED) countedPackages.push(extra);
    }

    if(countedPackages.length !== 0) {
        compilationButton.dataset.compilation = countedPackages.every(extra => extra.compilable === Compilable.FALSE) ? Compilable.FALSE : countedPackages.some(extra => extra.compilable === Compilable.FALSE) ? Compilable.PARTIALLY : Compilable.TRUE;
    } else compilationButton.dataset.compilation = Compilable.FALSE;
}

export function initializeExtras(enabled_extras_names = []) {
    const dropdown = document.getElementById("settings-options");
    const extrasMenu = document.getElementById("extras-menu")
    const extrasMenuToggleButton = document.getElementById('extras-option-button');

    for(let extrasPackage of Object.values(packages)) {
        const element = document.createElement('li');
        element.classList.add('option', 'noclose');
        element.style = "display:flex; justify-content: space-between;";

        const iconSpan = document.createElement('span');
        iconSpan.classList.add('icon');
        iconSpan.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        const textSpan = document.createElement('span');
        textSpan.classList.add('text');
        textSpan.innerText = extrasPackage.name;

        element.appendChild(textSpan);
        element.appendChild(iconSpan);

        if((enabled_extras_names.length === 0 && extrasPackage.enabledByDefault) || enabled_extras_names.includes(extrasPackage.name)) {
            element.classList.add('enabled');
            settings.packages[extrasPackage.name] = extrasPackage;  
            iconSpan.innerHTML = '<i class="fa-solid fa-check"></i>'; 
        }

        element.dataset.id = extrasPackage.name;
        extrasMenu.appendChild(element);
    }

    initializeDropdown(dropdown);
    addSelectionListener(dropdown, option => {
        if(!option.dataset.id) return;

        const selected = option.dataset.id;
        const iconSpan = option.querySelector('.icon');

        if(selected in activePackages) {
            delete activePackages[selected];
            option.classList.remove('enabled');
            iconSpan.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        } else {
            activePackages[selected] = packages[selected];
            option.classList.add('enabled');
            iconSpan.innerHTML = '<i class="fa-solid fa-check"></i>';
        }

        updateCompilationButton();
    });

    extrasMenuToggleButton.addEventListener('click', () => {
        extrasMenu.style.opacity = extrasMenu.style.opacity == 0 ? 1 : 0;
    })
}