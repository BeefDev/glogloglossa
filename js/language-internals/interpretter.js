import { Error, TokenType, Token} from './lexer.js'
import { NativeNode } from './nodes.js';

export const ValueType = {
    INTEGER: "ΑΚΕΡΑΙΑ",
    REAL: "ΠΡΑΓΜΑΤΙΚΗ",
    STRING: "ΧΑΡΑΚΤΗΡΑΣ",
    BOOLEAN: "ΛΟΓΙΚΗ"
};

export class TerminationError {
    constructor() {
        this.termination_error = true;
    }
}

export class TypedValue {
    constructor(type, value = null) {
        this.type = type;
        this.value = value;
    }

    toString() {
        return this.value.toString();
    }
};

export function determineValueType(value, convertStrings = false) {
    if(typeof value === 'boolean' || (convertStrings && typeof value === 'string' && value === 'ΑΛΗΘΗΣ' || value === 'ΨΕΥΔΗΣ')) {
        return ValueType.BOOLEAN
    } 

    if(!isNaN(value)) {
        if(Number.isInteger(Number(value))) {
            return ValueType.INTEGER;
        } else { 
            return ValueType.REAL;
        }
    } 

    if(typeof value === 'string') {
        return ValueType.STRING
    } 

    return null;
};

export function compareValueTypes(type1, type2, bidirectional=false) {
    if(type1 === type2) return true;
    if(type1 === ValueType.REAL && type2 === ValueType.INTEGER) return true;
    if(type1 === ValueType.STRING) return true;
    if(bidirectional) {
        if(type2 === ValueType.REAL && type1 === ValueType.INTEGER) return true;
        if(type2 === ValueType.STRING) return true;
    }

    return false;
};

export const SymbolTypes = {
    VALUE: "VALUE",
    FUNCTION: "FUNCTION",
    PROCESS: "PROCESS"
};

export class SymbolTableEntry {
    constructor(identifier_token, symbol_type, data) {
        this.identifier_token = identifier_token;
        this.symbol_type = symbol_type;
        this.data = data;
    }
};

export class SymbolTableValueEntryData {
    constructor(type, modifiable, value) {
        this.type = type;
        this.modifiable = modifiable;
        this.value = value;
    }
};

export class SymbolTableFunctionEntryData {
    constructor(return_type, argument_types, argument_tokens, constant_declarations_node, variable_declarations_node, code_node) {
        this.native = false;

        this.return_type = return_type;
        this.argument_types = argument_types;
        this.argument_tokens = argument_tokens;
        this.constant_declarations_node = constant_declarations_node;
        this.variable_declarations_node = variable_declarations_node;
        this.code_node = code_node;
    }
};

export class SymbolTableProcessEntryData {
    constructor(argument_types, argument_tokens, constant_declarations_node, variable_declarations_node, code_node) {
        this.native = false;

        this.argument_types = argument_types;
        this.argument_tokens = argument_tokens;
        this.constant_declarations_node = constant_declarations_node;
        this.variable_declarations_node = variable_declarations_node;
        this.code_node = code_node;
    }
};

export class SymbolTableNativeExecutableEntryData {
    constructor(codeFunction) {
        this.native = true;
        this.code_node = new NativeNode(codeFunction);
    }
};

export class SymbolTableCheckedNativeFunctionData {
    constructor(codeFunction, return_type, argument_types, identifier) {
        this.native = false;

        this.return_type = return_type;
        this.argument_types = argument_types;
        this.argument_tokens = argument_types.map((type, index) => new Token(TokenType.IDENTIFIER, null, null, index.toString()));
        this.constant_declarations_node = null;
        this.variable_declarations_node = new NativeNode((ioHandler, symbolTable) => {
            for(let i = 0; i<this.argument_tokens.length; i++) {
                symbolTable.registerWithToken(this.argument_tokens[i], SymbolTypes.VALUE, new SymbolTableValueEntryData(this.argument_types[i], true, null))
            }
        });

        this.code_node = new NativeNode(async (ioHandler, symbolTable, args) => {
            const result = await codeFunction(ioHandler, symbolTable, args);
            symbolTable.assignValueWithString(identifier, result);
        });
    }
}

export class SymbolTableCheckedNativeProcessData {
    constructor(codeFunction, argument_types, identifier) {
        this.native = false;

        this.argument_types = argument_types;
        this.argument_tokens = argument_types.map((type, index) => new Token(TokenType.IDENTIFIER, null, null, index.toString()));
        this.constant_declarations_node = null;
        this.variable_declarations_node = new NativeNode((ioHandler, symbolTable) => {
            for(let i = 0; i<this.argument_tokens.length; i++) {
                symbolTable.registerWithToken(this.argument_tokens[i], SymbolTypes.VALUE, new SymbolTableValueEntryData(this.argument_types[i], true, null))
            }
        });

        this.code_node = new NativeNode(codeFunction);
    }
}

export class SymbolTable {
    constructor(parent) {
        this.symbols = {};
        this.parent = parent;
    }

    retrieveWithToken(identifier_token, throws = false) {
        if(identifier_token.value in this.symbols) {
            return this.symbols[identifier_token.value];
        }

        if(this.parent == null) {
            if(throws) {
                throw new Error(`Το αναγνωριστικό '${identifier_token.value}' δεν έχει δηλωθεί`, identifier_token.position_start, identifier_token.position_end);
            }

            return null;
        }

        return this.parent.retrieveWithToken(identifier_token, throws);
    }

    retrieveWithString(identifier, throws = false) {
        const identifier_token = new Token(TokenType.IDENTIFIER, null, null, identifier);
        return this.retrieveWithToken(identifier_token, throws);
    }

    registerWithToken(identifier_token, type, data, override_checks=false) {
        if(!override_checks) {
            if(this.retrieveWithToken(identifier_token) != null) {
                throw new Error(`Το αναγνωριστικό ${identifier_token.value} χρησιμοποιείται είδη`, identifier_token.position_start, identifier_token.position_end);
            }
        }

        this.symbols[identifier_token.value] = new SymbolTableEntry(identifier_token, type, data);
    }

    registerWithString(identifier, type, data, override_checks=false) {
        const identifier_token = new Token(TokenType.IDENTIFIER, null, null, identifier);
        this.registerWithToken(identifier_token, type, data, override_checks);
    }

    assignValueWithToken(identifier_token, value) {
        const entry = this.retrieveWithToken(identifier_token, true);
        if(entry.symbol_type !== SymbolTypes.VALUE || !entry.data.modifiable) {
            throw new Error(`${identifier_token.value} δεν είναι μεταβλητή`, identifier_token.position_start, identifier_token.position_end);
        }

        if(!compareValueTypes(entry.data.type, determineValueType(value))) {
            throw new Error(`Δεν μπορώ να δώσω ${determineValueType(value)} τιμή σε ${entry.data.type} μεταβλητή`);
        }

        entry.data.value = value;
    }

    assignValueWithString(identifier, value) {
        const identifier_token = new Token(TokenType.IDENTIFIER, null, null, identifier);
        this.assignValueWithToken(identifier_token, value);
    }
};

export class IOHandler {
    constructor(requestInput, reprintInput, output, outputError, outputStyled) {
        this.requestInput = requestInput;
        this.reprintInput = reprintInput;
        this.output = output;
        this.outputError = outputError;
        this.outputStyled = outputStyled; 
    }
};

export default class Interpretter {
    constructor(ioHandler, node) {
        this.ioHandler = ioHandler;
        this.node = node;
    }

    async execute(finishedCallback, builtinSymbolTable = null) {
        const globalSymbolTable = new SymbolTable(builtinSymbolTable);
        const symbolTable = new SymbolTable(globalSymbolTable);

        try {
            await this.node.visit(this.ioHandler, symbolTable);
            finishedCallback();
        } catch(error) {
            if(error.termination_error) {
                return;
            }

            throw error;
        }
    }
}