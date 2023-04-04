import { compareValueTypes, determineValueType, SymbolTable, SymbolTableFunctionEntryData, SymbolTableProcessEntryData, SymbolTableValueEntryData, SymbolTypes, TypedValue, ValueType } from './interpretter.js'
import { Token, TokenType, Error } from './lexer.js';

class Node {
    constructor(position_start, position_end) {
        this.position_start = position_start;
        this.position_end = position_end;
    }

    visit(ioHandler, symbolTable) {
        throw new Error("No visitation method defined for class " + this.constructor.name);
    }
};

export class ValueNode extends Node {
    constructor(value_token) {
        super(value_token.position_start, value_token.position_end);
        this.value_token = value_token;
        console.log(this.value_token);
    }

    visit() {
        return new TypedValue(ValueType[this.value_token.type], this.value_token.value);
    }

    toString() {
        return this.value_token.value.toString();
    }
};

export class NativeNode extends Node {
    constructor(callable) {
        super(null,null);
        this.callable = callable;
    }

    async visit(ioHandler, symbolTable, args) {
        try {
            return await this.callable(ioHandler, symbolTable, args);
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return "[NATIVE CODE]"
    }
};

export class UnaryOperationNode extends Node  {
    constructor(operator_token, operand_node) {
        super(operator_token.position_start, operand_node.position_end);
        this.operator_token = operator_token;
        this.operand_node = operand_node;
    }

    async visit(ioHandler, symbolTable) {
        try {
            const operand_value = await this.operand_node.visit(ioHandler, symbolTable);
            if(![ValueType.INTEGER, ValueType.REAL].includes(operand_value.type)) {
                throw new Error("Περίμενα αριθμό", this.operand_node.position_start, this.operand_node.position_end);
            }

            if(this.operator_token.type === TokenType.PLUS) {
                return operand_value;
            } else {
                return new TypedValue(operand_value.type, -operand_value.value);
            }
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `UNARY[${this.operator_token.toString()} ${this.operand_node.toString()}]`
    }
};

export class BinaryOperationNode extends Node {
    constructor(operator_token, left_operand_node, right_operand_node) {
        super(left_operand_node.position_start, right_operand_node.position_start);
        this.left_operand_node = left_operand_node;
        this.right_operand_node = right_operand_node;
        this.operator_token = operator_token;
    }

    toString() {
        return `BINARY[${this.left_operand_node.toString()} ${this.operator_token.toString()} ${this.right_operand_node.toString()}]`;
    }

    async visit(ioHandler, symbolTable) {
        try {
            if(this.operator_token.type === TokenType.KEYWORD) {
                const left_operand_value = await this.left_operand_node.visit(ioHandler, symbolTable);
                const right_operand_value = await this.right_operand_node.visit(ioHandler, symbolTable);
                const keyword = this.operator_token.value;
    
                if(left_operand_value.type !== ValueType.BOOLEAN) {
                    throw new Error("Περίμενα συνθήκη", this.left_operand_node.position_start, this.left_operand_node.position_end);
                }
    
                if(right_operand_value.type !== ValueType.BOOLEAN) {
                    throw new Error("Περίμενα συνθήκη", this.right_operand_node.position_start, this.right_operand_node.position_end);
                }
    
                if(keyword === 'ΚΑΙ') {
                    return new TypedValue(ValueType.BOOLEAN, left_operand_value.value && right_operand_value.value);
                } else {
                    return new TypedValue(ValueType.BOOLEAN, left_operand_value.value || right_operand_value.value);
                }
            }
    
            if([TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.POWER, TokenType.KEYWORD].includes(this.operator_token.type)) {
                const left_operand_value = await this.left_operand_node.visit(ioHandler, symbolTable);
                const right_operand_value = await this.right_operand_node.visit(ioHandler, symbolTable);
                const operation = this.operator_token.type === TokenType.KEYWORD ? this.operator_token.value : this.operator_token.type;
    
                if(left_operand_value.type !== ValueType.INTEGER && left_operand_value.type !== ValueType.REAL) {
                    throw new Error("Περίμενα αριθμό", this.left_operand_node.position_start, this.left_operand_node.position_end);
                }
    
                if(right_operand_value.type !== ValueType.INTEGER && right_operand_value.type !== ValueType.REAL) {
                    throw new Error("Περίμενα αριθμό", this.right_operand_node.position_start, this.right_operand_node.position_end);
                }
    
                const value_type = [TokenType.DIVIDE, TokenType.POWER].includes(this.operator_token.type) ? ValueType.REAL : right_operand_value.type === ValueType.REAL || left_operand_value.type === ValueType.REAL ? ValueType.REAL : ValueType.INTEGER;
                let value;
    
                if(operation === TokenType.PLUS) value = +left_operand_value.value + +right_operand_value.value;
                else if(operation === TokenType.MINUS) value = left_operand_value.value - right_operand_value.value;
                else if(operation === TokenType.MULTIPLY) value = left_operand_value.value * right_operand_value.value;
                else if(operation === TokenType.POWER) value = Math.pow(left_operand_value.value, right_operand_value.value);
                else if(operation === TokenType.DIVIDE) {
                    if(right_operand_value.value === 0) {
                        throw new Error("Δεν μπορώ να διαιρέσω με το 0", this.right_operand_node.position_start, this.right_operand_node.position_end);
                    }
                    value = left_operand_value.value / right_operand_value.value;
                } else if(operation === "MOD" || operation === "DIV") {
                    if(value_type !== ValueType.INTEGER) {
                        throw new Error(`Το ${operation} μπορεί να χρησιμοποιήθει μόνο σε ακεραίους αριθμούς`, this.operator_token.position_start, this.operator_token.position_end);
                    }
    
                    if(operation === "DIV") value = Math.floor(left_operand_value.value / right_operand_value.value);
                    else if(this.operator_token.value === "MOD") value = left_operand_value.value % right_operand_value.value;
                }
    
                return new TypedValue(value_type, value);
            }
    
            if(this.operator_token.type === TokenType.EQUALS || this.operator_token.type === TokenType.NOT_EQUALS) {
                const left_operand_value = await this.left_operand_node.visit(ioHandler, symbolTable);
                const right_operand_value = await this.right_operand_node.visit(ioHandler, symbolTable);
                if(!compareValueTypes(left_operand_value.type, right_operand_value.type, true)) {
                    throw new Error("Δεν μπορώ να συγκρίνω ανόμιες μεταβλητές", this.operator_token.position_start, this.operator_token.position_end); 
                }
    
                return new TypedValue(ValueType.BOOLEAN, this.operator_token.type === TokenType.EQUALS ? left_operand_value.value === right_operand_value.value : left_operand_value.value !== right_operand_value.value);
            }
    
            if([TokenType.LESS, TokenType.GREATER, TokenType.LESS_OR_EQUAL, TokenType.GREATER_OR_EQUAL].includes(this.operator_token.type)) {
                const left_operand_value = await this.left_operand_node.visit(ioHandler, symbolTable);
                const right_operand_value = await this.right_operand_node.visit(ioHandler, symbolTable);
                console.log(left_operand_value);
                if(![ValueType.INTEGER, ValueType.REAL].includes(left_operand_value.type)) {
                    throw new Error("Περίμενα αριθμό", this.left_operand_node.position_start, this.left_operand_node.position_end);
                }
    
                if(![ValueType.INTEGER, ValueType.REAL].includes(right_operand_value.type)) {
                    throw new Error("Περίμενα αριθμό", this.right_operand_node.position_start, this.right_operand_node.position_end);
                }
    
                let value;
                if(this.operator_token.type === TokenType.LESS) value = left_operand_value.value < right_operand_value.value;
                else if(this.operator_token.type === TokenType.LESS_OR_EQUAL) value = left_operand_value.value <= right_operand_value.value;
                else if(this.operator_token.type === TokenType.GREATER) {
                    value = left_operand_value.value > right_operand_value.value;
                }
                else value = left_operand_value.value >= right_operand_value.value;
                return new TypedValue(ValueType.BOOLEAN, value);
            }
        } catch(error) {
            throw error;
        }
    }
};

export class VariableAccessNode extends Node  {
    constructor(variable_token) {
        super(variable_token.position_start, variable_token.position_end);
        this.variable_token = variable_token;
    }

    visit(ioHandler, symbolTable) {
        const entry = symbolTable.retrieveWithToken(this.variable_token, true);
        if(entry.symbol_type !== SymbolTypes.VALUE) {
            throw new Error(`'${this.variable_token.value.toString()}' δεν είναι μεταβλήτη`, this.variable_token.position_start, this.variable_token.position_end);
        }

        if(entry.data.value == null) {
            throw new Error(`'${this.variable_token.value.toString()}' δεν έχει καμία τιμή`, this.variable_token.position_start, this.variable_token.position_end);
        }

        return new TypedValue(entry.data.type, entry.data.value);
    }

    toString() {
        return `VARIABLE:${this.variable_token.value.toString()}`
    }
};

export class VariableAssignmentNode extends Node {
    constructor(identifier_token, value_node) {
        super(identifier_token.position_start, value_node.position_end);
        this.identifier_token = identifier_token;
        this.value_node = value_node;
    }

    toString() {
        return `ASSIGN ${this.identifier_token.value.toString()} TO ${this.value_node.toString()}]`;
    }

    async visit(ioHandler, symbolTable) {
        try {
            const value = await this.value_node.visit(ioHandler, symbolTable);
            symbolTable.assignValueWithToken(this.identifier_token, value);
        } catch(error) {
            throw error;
        }
    }
};

export class WriteInstructionNode extends Node  {
    constructor(instruction_token, parameter_nodes) {
        super(instruction_token.position_start, parameter_nodes.length === 0 ? instruction_token.position_end : parameter_nodes[parameter_nodes.length-1].position_end);
        this.parameter_nodes = parameter_nodes;
    }

    async visit(ioHandler, symbolTable) {
        try {
            const values = [];
            for(let node of this.parameter_nodes) {
                const value = await node.visit(ioHandler, symbolTable);
                if(value == null) {
                    throw new Error("Περίμενα κάποια τιμή", node.position_start, node.position_end);
                }

                values.push(value);
            }
    
            ioHandler.output(values.reduce(((output, value) => output += value + " "), ""));
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `WRITE{${this.parameter_nodes.map(operand => operand.toString())}}`
    }
};

export class ReadInstructionNode extends Node {
    constructor(instruction_token, parameter_tokens) {
        super(instruction_token.position_start, parameter_tokens[parameter_tokens.length-1].position_end);
        this.parameter_tokens = parameter_tokens;
    }

    async visit(ioHandler, symbolTable) {
        for(let variable_token of this.parameter_tokens) {
            try {
                const input = await ioHandler.requestInput();
                ioHandler.reprintInput(input);

                console.log("A:"+document.querySelector(".console").childElementCount);

                const entry = symbolTable.retrieveWithToken(variable_token, true);
                if(entry.symbol_type !== SymbolTypes.VALUE) {
                    throw new Error(`'${variable_token.value.toString()}' δεν είναι μεταβλητή`, variable_token.position_start, variable_token.position_end);
                }

                const value_type = determineValueType(input, true);
                if(!compareValueTypes(entry.data.type, value_type, {stringsPass:true})) {
                    throw new Error(`Περίμενα ${entry.data.type} άλλα πήρα ${value_type}`);
                }

                let value;
                if(entry.data.type === ValueType.STRING) value = input;
                else if(entry.data.type === ValueType.BOOLEAN) {
                    if(input === "ΑΛΗΘΗΣ") value = true;
                    else if(input === "ΨΕΥΔΗΣ") value = false;
                    else throw new Error("Περίμενα συνθήκη", variable_token.position_start, variable_token.position_end);
                } else if(entry.data.type === ValueType.INTEGER) {
                    if(isNaN(input) || !Number.isInteger(Number(input))) throw new Error("Περίμενα ακέραιο αριθμό", variable_token.position_start, variable_token.position_end);
                    value = parseInt(input);
                } else {
                    if(isNaN(input)) throw new Error("Περίμενα αριθμό", variable_token.position_start, variable_token.position_end);
                    value = parseFloat(input);
                }

                symbolTable.assignValueWithToken(variable_token, value);
            } catch(error) {
                throw error;
            }
        }
    }

    toString() {
        return `READ{${this.parameter_tokens.map(operand => operand.value)}}`
    }
};

export class IfStatementNode extends Node {
    constructor(cases, else_case) {
        super(cases[0].position_start, else_case == null ? cases[cases.length-1].position_end : else_case.position_end);
        this.cases = cases;
        this.else_case = else_case;
    }

    async visit(ioHandler, symbolTable) {
        try {
            const results = []; 
            for(let case0 of this.cases) {
                results.push(await case0.condition.visit(ioHandler, symbolTable));
            }

            for(let i = 0; i<results.length; i++) {
                if(results[i].type !== ValueType.BOOLEAN) {
                    throw new Error("Περίμενα συνθήκη", this.cases[i].position_start, this.cases[i].position_end)
                }
            }

            for(let i = 0; i<results.length; i++) {
                if(results[i].value) {
                    await this.cases[i].code.visit(ioHandler, symbolTable);
                    return;
                }
            }

            if(this.else_case != null) {
                await this.else_case.visit(ioHandler, symbolTable);
            }
        } catch(error) {
            throw error;
        }
    }

    toString() {
        let result = `IF ${this.cases[0].condition.toString()} THEN ${this.cases[0].code.toString(" ")}`;
        for(let i = 1; i<this.cases.length; i++) {
            result += `\nELSE_IF ${this.cases[i].condition.toString()} THEN ${this.cases[i].code.toString(" ")}`
        }

        if(this.else_case != null) {
            result += `\nELSE ${this.else_case.toString(" ")}`
        }

        return result;
    }
};

export class WhileStatementNode extends Node {
    constructor(condition_node, code_node) {
        super(condition_node.position_start, code_node.position_end);
        this.condition_node = condition_node;
        this.code_node = code_node;
    }

    async visit(ioHandler, symbolTable) {
        try {
            let conditionResult = await this.condition_node.visit(ioHandler, symbolTable);
            if(conditionResult.type !== ValueType.BOOLEAN) {
                throw new Error("Περίμενα συνθήκη", this.condition_node.position_start, this.condition_node.position_end);
            }
    
            while(conditionResult.value) {
                await this.code_node.visit(ioHandler, symbolTable);
                conditionResult = await this.condition_node.visit(ioHandler, symbolTable);
            }
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `WHILE[${this.condition_node.toString()}] -> ${this.code_node.toString(" ")}`;
    }
};

export class WhileDoStatementNode extends Node {
    constructor(condition_node, code_node) {
        super(code_node.position_start, condition_node.position_end);
        this.condition_node = condition_node;
        this.code_node = code_node;
    }

    async visit(ioHandler, symbolTable) {
        try {
            await this.code_node.visit(ioHandler, symbolTable);

            let conditionResult = await this.condition_node.visit(ioHandler, symbolTable);
            if(conditionResult.type !== ValueType.BOOLEAN) {
                throw new Error("Περίμενα συνθήκη", this.condition_node.position_start, this.condition_node.position_end);
            }

            while(!conditionResult.value) {
                await this.code_node.visit(ioHandler, symbolTable);
                conditionResult = await this.condition_node.visit(ioHandler, symbolTable);
            }
        } catch(error) {
            throw error;
        }
    }
};

export class ForStatementNode extends Node {
    constructor(from_node, untill_node, variable_token, code_node, step_node) {
        super(from_node.position_start, code_node.position_end);
        this.from_node = from_node;
        this.untill_node = untill_node;
        this.step_node = step_node;
        this.variable_token = variable_token;
        this.code_node = code_node;
    }

    toString() {
        return `FOR ${this.variable_token.toString()}[${this.from_node.toString()} -> ${this.untill_node.toString()}, ${this.step_node.toString()}] -> ${this.code_node.toString(" ").replace("\n", "")}`;
    }

    async visit(ioHandler, symbolTable) {
        try {
            const entry = symbolTable.retrieveWithToken(this.variable_token, true);
            if(entry.symbol_type !== SymbolTypes.VALUE) {
                throw new Error(`'${this.variable_token.value.toString()}' δεν είναι μεταβλητή`, this.variable_token.position_start, this.variable_token.position_end);
            }

            if(![ValueType.INTEGER, ValueType.REAL].includes(entry.data.type)) {
                throw new Error("Η μεταβλητή που χρησιμοποιείται στην ΓΙΑ πρέπει να είναι αριθμός", this.variable_token.position_start, this.variable_token.position_end);
            }

            const initialValue = (await this.from_node.visit(ioHandler, symbolTable)).value;
            let finalValue = (await this.untill_node.visit(ioHandler, symbolTable)).value; 
            let stepValue = this.step_node != null ? (await this.step_node.visit(ioHandler, symbolTable)).value : null;

            const increasing = finalValue > initialValue;
            if(stepValue == null) {
                stepValue = increasing ? 1 : -1;
            }

            symbolTable.assignValueWithToken(this.variable_token, initialValue);
            while(increasing ? symbolTable.retrieveWithToken(this.variable_token, true).data.value <= finalValue : symbolTable.retrieveWithToken(this.variable_token, true).data.value >= finalValue) {
                await this.code_node.visit(ioHandler, symbolTable);
                finalValue = (await this.untill_node.visit(ioHandler, symbolTable)).value;
                if(this.step_node != null) {
                    stepValue = (await this.step_node.visit(ioHandler, symbolTable)).value;
                }

                symbolTable.assignValueWithToken(this.variable_token, symbolTable.retrieveWithToken(this.variable_token, true).data.value + stepValue);
            }
        } catch(error) {
            throw error;
        }
    }
};

export class ValueDefinitionNode extends Node {
    constructor(identifier_token, value, modifiable) {
        super(identifier_token.position_start, value.value_node ? value.value_node.position_end : identifier_token.position_end);
        this.identifier_token = identifier_token;
        this.modifiable = modifiable;
        this.value = value;
    }

    async visit(ioHandler, symbolTable) {
        try {
            let data;
            if(this.value.value_node == null) {
                data = new SymbolTableValueEntryData(this.value.type, this.modifiable, null);
            } else {
                const result = await this.value.value_node.visit(ioHandler, symbolTable);
                data = new SymbolTableValueEntryData(result.type, this.modifiable, result.value);
            }

            symbolTable.registerWithToken(this.identifier_token, SymbolTypes.VALUE, data);
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `DEFINE ${this.modifiable ? "VARIABLE" : "CONSTANT"} ${this.identifier_token.value} `;
    }
};

export class StatementsNode extends Node {
    constructor(nodes = []) {
        super(nodes.length === 0 ? null : nodes[0].position_start, nodes.length === 0 ? null : nodes[nodes.length-1].position_end);
        this.nodes = nodes;
    }

    async visit(ioHandler, symbolTable) {
        try {
            for(let node of this.nodes) {
                await node.visit(ioHandler, symbolTable);
            }
        } catch(error) {
            throw error;
        }
    }

    toString(separator = '\n') {
        if(this.nodes.length === 0) return "";

        let result = "";
        for(let i = 0; i<this.nodes.length; i++) {
            const node = this.nodes[i].toString();
            if(node !== " ") {
                result += node + separator;
            }
        }

        return result.substring(0, result.length - 1);
    }
};

export class FunctionDefinitionNode extends Node {
    constructor(identifier_token, parameter_tokens, return_type, variable_declarations, constant_declarations, code_node) {
        super(identifier_token.position_start, code_node.position_end);

        this.identifier_token = identifier_token;
        this.parameter_tokens = parameter_tokens;
        this.return_type = return_type;
        this.variable_declarations = variable_declarations;
        this.constant_declarations = constant_declarations;
        this.code_node = code_node;

        if(this.parameter_tokens.length !== 0 && this.variable_declarations == undefined) {
            throw new Error(`Η παράμετρος '${this.parameter_tokens[0].value}' δεν έχει οριστεί στις μεταβλητές της '${this.identifier_token.value}'`);
        }

        this.parameter_types = [];
        for(let parameter_token of this.parameter_tokens) {
            let matched = false;
            for(let variable_declaration of this.variable_declarations.nodes) {
                if(parameter_token.value === variable_declaration.identifier_token.value) {
                    this.parameter_types.push(variable_declaration.value.type);
                    matched = true;
                    break;
                }
            }

            if(!matched) {
                throw new Error(`Η παράμετρος '${parameter_token.value}' δεν έχει οριστεί στις μεταβλητές της '${this.identifier_token.value}'`);
            }
        }
    }

    visit(ioHandler, symbolTable) {
        symbolTable.parent.registerWithToken(this.identifier_token, SymbolTypes.FUNCTION, new SymbolTableFunctionEntryData(this.return_type, this.parameter_types, this.parameter_tokens, this.constant_declarations, this.variable_declarations, this.code_node));
    }

    toString() {
        return `DEFINE FUNCTION ${this.identifier_token.value}`
    }
};

export class ProcessDefinitionNode extends Node {
    constructor(identifier_token, parameter_tokens, variable_declarations, constant_declarations, code_node) {
        super(identifier_token.position_start, code_node.position_end);

        this.identifier_token = identifier_token;
        this.parameter_tokens = parameter_tokens;
        this.variable_declarations = variable_declarations;
        this.constant_declarations = constant_declarations;
        this.code_node = code_node;

        if(this.parameter_tokens.length !== 0 && this.variable_declarations == undefined) {
            throw new Error(`Η παράμετρος '${this.parameter_tokens[0].value}' δεν έχει οριστεί στις μεταβλητές της '${this.identifier_token.value}'`);
        }

        this.parameter_types = [];
        for(let parameter_token of this.parameter_tokens) {
            let matched = false;
            for(let variable_declaration of this.variable_declarations.nodes) {
                if(parameter_token.value === variable_declaration.identifier_token.value) {
                    this.parameter_types.push(variable_declaration.value.type);
                    matched = true;
                    break;
                }
            }

            if(!matched) {
                throw new Error(`Η παράμετρος '${parameter_token.value}' δεν έχει οριστεί στις μεταβλητές της '${this.identifier_token.value}'`);
            }
        }
    }

    visit(ioHandler, symbolTable) {
        symbolTable.parent.registerWithToken(this.identifier_token, SymbolTypes.PROCESS, new SymbolTableProcessEntryData(this.parameter_types, this.parameter_tokens, this.constant_declarations, this.variable_declarations, this.code_node));
    }

    toString() {
        return `DEFINE PROCESS ${this.identifier_token.value}`
    }
};

export class FunctionCallNode extends Node {
    constructor(identifier_token, parameter_nodes) {
        super(identifier_token.position_start, parameter_nodes.length === 0 ? identifier_token.position_end : parameter_nodes[parameter_nodes.length-1].position_end.cloneHorizontalOffset(1));
        this.identifier_token = identifier_token;
        this.parameter_nodes = parameter_nodes;
    }
    
    async visit(ioHandler, symbolTable) {
        try {
            const entry = symbolTable.retrieveWithToken(this.identifier_token, true);
            if(entry.symbol_type !== SymbolTypes.FUNCTION) {
                throw new Error("Δεν υπάρχει συνάρτηση με το όνομα " + this.identifier_token.value);
            }

            const values = [];
            for(let param of this.parameter_nodes) {
                values.push(await param.visit(ioHandler, symbolTable));
            }

            if(entry.data.native) {
                return await entry.data.code_node.visit(ioHandler, symbolTable, values);
            } else {
                const argument_types = entry.data.argument_types;
                if(values.length !== argument_types.length) {
                    throw new Error(`Λανθασμένος αριθμός παραμέτρων, περίμενα ${argument_types.length} αλλά πήρα ${values.length}`);
                } else {
                    for(let i = 0; i<argument_types.length; i++) {
                        if(!compareValueTypes(argument_types[i], values[i].type)) {
                            console.log(values[i].type, argument_types[i])
                            throw new Error("Λάθος τύπος παράμετρου, περίμενα " + argument_types[i], this.parameter_nodes[i].position_start, this.parameter_nodes[i].position_end);
                        }
                    }
                }

                const scopedSymbolTable = new SymbolTable(symbolTable.parent);
                scopedSymbolTable.registerWithToken(this.identifier_token, SymbolTypes.VALUE, new SymbolTableValueEntryData(entry.data.return_type, true, null), true);

                if(entry.data.constant_declarations_node) await entry.data.constant_declarations_node.visit(ioHandler, scopedSymbolTable);
                if(entry.data.variable_declarations_node) await entry.data.variable_declarations_node.visit(ioHandler, scopedSymbolTable);

                for(let i = 0; i < entry.data.argument_tokens.length; i++) {
                    scopedSymbolTable.assignValueWithToken(entry.data.argument_tokens[i], await this.parameter_nodes[i].visit(ioHandler, symbolTable).value);
                }

                await entry.data.code_node.visit(ioHandler, scopedSymbolTable, values);
                return scopedSymbolTable.retrieveWithToken(this.identifier_token).data.value;
            }
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `CALL FUNCTION ${this.identifier_token.toString()} WITH (${this.parameter_nodes.map(param => param.toString())})`
    }
};

export class ProcessCallNode extends Node {
    constructor(identifier_token, parameter_nodes) {
        super(identifier_token.position_start, parameter_nodes.length === 0 ? identifier_token.position_end : parameter_nodes[parameter_nodes.length-1].position_end);
        this.identifier_token = identifier_token;
        this.parameter_nodes = parameter_nodes;
    }
    
    async visit(ioHandler, symbolTable) {
        try {
            const entry = symbolTable.retrieveWithToken(this.identifier_token, true);
            if(entry.symbol_type !== SymbolTypes.PROCESS) {
                throw new Error("Δεν υπάρχει διαδικασία με το όνομα " + this.identifier_token.value);
            }

            const values = [];
            for(let param of this.parameter_nodes) {
                values.push(await param.visit(ioHandler, symbolTable));
            }

            if(entry.data.native) {
                return await entry.data.code_node.visit(ioHandler, symbolTable, values);
            } else {
                const argument_types = entry.data.argument_types;
                if(values.length !== argument_types.length) {
                    throw new Error(`Λανθασμένος αριθμός παραμέτρων, περίμενα ${argument_types.length} αλλά πήρα ${values.length}`);
                } else {
                    for(let i = 0; i<argument_types.length; i++) {
                        if(!compareValueTypes(argument_types[i], values[i].type)) {
                            throw new Error("Λάθος τύπος παραμέτρου, περίμενα " + argument_types[i], this.parameter_nodes[i].position_start, this.parameter_nodes[i].position_end);
                        }
                    }
                }

                const scopedSymbolTable = new SymbolTable(symbolTable.parent);

                if(entry.data.constant_declarations_node) await entry.data.constant_declarations_node.visit(ioHandler, scopedSymbolTable);
                if(entry.data.variable_declarations_node) await entry.data.variable_declarations_node.visit(ioHandler, scopedSymbolTable);

                for(let i = 0; i < entry.data.argument_tokens.length; i++) {
                    scopedSymbolTable.assignValueWithToken(entry.data.argument_tokens[i], await this.parameter_nodes[i].visit(ioHandler, symbolTable).value);
                }

                await entry.data.code_node.visit(ioHandler, scopedSymbolTable, values);

                for(let i = 0; i<this.parameter_nodes.length; i++) {
                    if(this.parameter_nodes[i] instanceof VariableAccessNode) {
                        const variableToken = this.parameter_nodes[i].variable_token;
                        symbolTable.assignValueWithToken(variableToken, scopedSymbolTable.retrieveWithToken(variableToken).data.value);
                    }
                }
            }
        } catch(error) {
            throw error;
        }
    }

    toString() {
        return `CALL PROCES ${this.identifier_token.toString()}(${this.parameter_nodes.map(param => param.toString())})`
    }
};