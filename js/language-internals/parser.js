import { Error, Token, TokenType } from "./lexer.js";
import { BinaryOperationNode, IfStatementNode, ForStatementNode, FunctionCallNode, FunctionDefinitionNode, ProcessDefinitionNode, ReadInstructionNode, StatementsNode, ValueDefinitionNode, ValueNode, VariableAccessNode, VariableAssignmentNode, WhileDoStatementNode, WhileStatementNode, WriteInstructionNode, UnaryOperationNode, ProcessCallNode } from "./nodes.js";
import { ValueType } from "./interpretter.js";

export default class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current_token = null;
        this.current_position = -1;

        this.advance();
    }

    advance() {
        this.current_position++;
        this.current_token = this.current_position >= this.tokens.length ? null : this.tokens[this.current_position];
    }

    backtrack() {
        if(this.current_position <= 0) {
            return;
        }

        this.current_position--;
        this.current_token = this.current_position >= this.tokens.length ? null : this.tokens[this.current_position];
    }

    make_statements(predicate) {
        const statements = [];
        while(this.current_token.type === TokenType.NEWLINE) {
            this.advance();
        } 

        if(this.current_token.type === TokenType.EOF || !predicate(this.current_token)) {
            return new StatementsNode(statements);
        }

        statements.push(this.make_statement());
        while(this.current_token.type === TokenType.NEWLINE) {
            while(this.current_token.type === TokenType.NEWLINE) {
                this.advance();
            } 

            if(this.current_token.type === TokenType.EOF || !predicate(this.current_token)) {
                return new StatementsNode(statements);
            }

            statements.push(this.make_statement());
        }
        
        while(this.current_token.type === TokenType.NEWLINE) {
            this.advance();
        }

        return new StatementsNode(statements);
    }

    make_statement() {
        let node;
        if(this.current_token.type === TokenType.KEYWORD) {
            if(this.current_token.value === "ΓΡΑΨΕ") {
                node = this.make_write_instruction_call();
            } else if(this.current_token.value === "ΔΙΑΒΑΣΕ") {
                node = this.make_read_instruction_call();
            } else if(this.current_token.value === "ΑΝ") {
                node = this.make_if_statement();
            } else if(this.current_token.value === "ΟΣΟ") {
                node = this.make_while_statement();
            } else if(this.current_token.value === "ΑΡΧΗ_ΕΠΑΝΑΛΗΨΗΣ") {
                node = this.make_while_do_statement();
            } else if(this.current_token.value === "ΓΙΑ") {
                node = this.make_for_statement();
            } else if(this.current_token.value === "ΚΑΛΕΣΕ") {
                node = this.make_process_call();
            }
        } else if(this.current_token.type === TokenType.IDENTIFIER) {
            node = this.make_variable_assign_statement();
        }

        if(node != undefined) {
            if(this.current_token.type === TokenType.NEWLINE || this.current_token === TokenType.EOF) {
                return node;
            }

            throw new Error("Περίμενα τέλος γραμής", this.current_token.position_start, this.current_token.position_end);
        }

        throw new Error("Περίμενα κάποια εντολή", this.current_token.position_start, this.current_token.position_end);
    }

    make_variable_assign_statement() {
        const variableToken = this.current_token;
        this.advance();

        if(this.current_token.type !== TokenType.ASSIGN) {
            throw new Error("Παράνομη εντολή", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        return new VariableAssignmentNode(variableToken, this.make_expression());
    }

    make_if_statement() {
        function predicate(token) {
            return !(token.type === TokenType.KEYWORD && token.value === 'ΑΛΛΙΩΣ_ΑΝ' || token.value === 'ΑΛΛΙΩΣ' || token.value === "ΤΕΛΟΣ_ΑΝ");
        }

        const cases = [];
        this.advance();
        const firstCase = this.make_expression();

        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΤΟΤΕ') {
            throw new Error("Περίμενα 'ΤΟΤΕ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        const firstCaseStatements = this.make_statements(predicate);
        cases.push({
            condition: firstCase,
            code: firstCaseStatements
        });
        
        while(this.current_token.type === TokenType.KEYWORD && this.current_token.value === 'ΑΛΛΙΩΣ_ΑΝ') {
            this.advance();
            const condition = this.make_expression();

            if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΤΟΤΕ') {
                throw new Error("Περίμενα 'ΤΟΤΕ'", this.current_token.position_start, this.current_token.position_end);
            }

            this.advance();
            const code = this.make_statements(predicate);
            cases.push({
                condition: condition,
                code: code
            });
        }

        let elseCase = null;
        if(this.current_token.type === TokenType.KEYWORD && this.current_token.value === 'ΑΛΛΙΩΣ') {
            this.advance();
            elseCase = this.make_statements(predicate);
        }

        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΤΕΛΟΣ_ΑΝ') {
            throw new Error("Περίμενα 'ΤΕΛΟΣ_ΑΝ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        return new IfStatementNode(cases, elseCase);
    }

    make_while_statement() {
        this.advance();
        const condition = this.make_expression();

        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΕΠΑΝΑΛΑΒΕ') {
            throw new Error("Περίμενα 'ΕΠΑΝΑΛΑΒΕ'", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();

        const code = this.make_statements(token => token.type !== TokenType.KEYWORD || token.value !== 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ');
        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ') {
            throw new Error("Περίμενα 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        return new WhileStatementNode(condition, code);
    }

    make_while_do_statement() {
        this.advance();
        const code = this.make_statements(token => token.type !== TokenType.KEYWORD || token.value !== 'ΜΕΧΡΙΣ_ΟΤΟΥ');

        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΜΕΧΡΙΣ_ΟΤΟΥ') {
            throw new Error("Περίμενα 'ΜΕΧΡΙΣ_ΟΤΟΥ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        const condition = this.make_expression();
        return new WhileDoStatementNode(condition, code);
    }

    make_for_statement() {
        this.advance();
        const variable = this.current_token;
        if(variable.type !== TokenType.IDENTIFIER) {
            throw new Error("Περίμενα μεταβλητή", variable.position_start, variable.position_end);
        }

        this.advance();
        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΑΠΟ') {
            throw new Error("Περίμενα 'ΑΠΟ'", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();

        const from = this.make_expression();
        let step;

        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΜΕΧΡΙ') {
            throw new Error("Περίμενα 'ΜΕΧΡΙ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        const untill = this.make_expression();
        
        if(this.current_token.type === TokenType.KEYWORD) {
            if(this.current_token.value === "ΜΕ_ΒΗΜΑ") {
                this.advance();
                step = this.make_expression();
            } else {
                throw new Error("Περίμενα 'ΜΕ_ΒΗΜΑ'", this.current_token.position_start, this.current_token.position_end);
            }
        }

        const code = this.make_statements(token => token.type !== TokenType.KEYWORD || token.value !== 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ');
        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ') {
            throw new Error("Περίμενα 'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        return new ForStatementNode(from, untill, variable, code, step);
    }

    make_write_instruction_call() {
        const operatorToken = this.current_token;
        const operands = [];
        this.advance();

        operands.push(this.make_expression());
        while(this.current_token.type === TokenType.COMMA) {
            this.advance();
            operands.push(this.make_expression());
        }

        return new WriteInstructionNode(operatorToken, operands);
    }

    make_read_instruction_call() {
        const operatorToken = this.current_token;
        const operands = [];
        this.advance();

        if(this.current_token.type !== TokenType.IDENTIFIER) {
            throw new Error("Περίμενα μεταβλητή", this.current_token.position_start, this.current_token.position_end);
        }

        operands.push(this.current_token);
        this.advance();
        while(this.current_token.type === TokenType.COMMA) {
            this.advance();

            if(this.current_token.type === TokenType.IDENTIFIER) {
                operands.push(this.current_token);
                this.advance();
            } else {
                throw new Error("Περίμενα μεταβλητή", this.current_token.position_start, this.current_token.position_end);
            }
        }

        return new ReadInstructionNode(operatorToken, operands);
    }

    make_binary_operation(operandSupplier, operatorPredicate) {
        let leftOperand = operandSupplier();
        while(operatorPredicate(this.current_token)) {
            const operatorToken = this.current_token;
            this.advance();

            const rightOperand = operandSupplier();
            leftOperand = new BinaryOperationNode(operatorToken, leftOperand, rightOperand);
        }

        return leftOperand;
    }

    make_expression() {
        return this.make_binary_operation(() => this.make_comparison_expression(), (token) => token.type === TokenType.KEYWORD && ["ΚΑΙ", "Η"].includes(token.value));
    }

    make_comparison_expression() {
        if(this.current_token.type === TokenType.KEYWORD) {
            if(this.current_token.value === 'ΟΧΙ') {
                const operatorToken = this.current_token;
                this.advance();

                return new UnaryOperationNode(operatorToken, this.make_comparison_expression());
            } else {
                throw new Error("Περίμενα συνθήκη", this.current_token.position_start, this.current_token.position_end);
            }
        }

        return this.make_binary_operation(() => this.make_basic_expression(), (token) => [TokenType.EQUALS, TokenType.GREATER, TokenType.LESS_OR_EQUAL, TokenType.LESS, TokenType.GREATER_OR_EQUAL, TokenType.NOT_EQUALS].includes(token.type));
    }

    make_basic_expression() {
        return this.make_binary_operation(() => this.make_term(), (token) => [TokenType.PLUS, TokenType.MINUS].includes(token.type));
    }

    make_term() {
        return this.make_binary_operation(() => this.make_factor(), (token) => [TokenType.POWER, TokenType.DIVIDE, TokenType.MULTIPLY].includes(token.type) || token.type === TokenType.KEYWORD && (token.value === "DIV" || token.value === "MOD"))
    }

    make_factor() {
        if(this.current_token.type === TokenType.PLUS || this.current_token.type === TokenType.MINUS) {
            const operatorToken = this.current_token;
            this.advance();

            return new UnaryOperationNode(operatorToken, this.make_atom());
        }

        return this.make_atom();
    }

    make_atom() {
        if([TokenType.INTEGER, TokenType.REAL, TokenType.STRING, TokenType.BOOLEAN].includes(this.current_token.type)) {
            return this.make_value();
        }

        if(this.current_token.type === TokenType.IDENTIFIER) {
            this.advance();

            let node; 
            if(this.current_token.type === TokenType.LEFT_PARENTHESIS) {
                this.backtrack();
                node = this.make_function_call();
            } else {
                this.backtrack();
                node = new VariableAccessNode(this.current_token);
                this.advance();
            }

            return node;
        }

        if(this.current_token.type === TokenType.LEFT_PARENTHESIS) {
            this.advance();
            const node = this.make_expression();
            
            if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
                this.advance();
                return node;
            } else {
                throw new Error("Περίμενα ')'", this.current_token.position_start, this.current_token.position_end);
            }
        }

        throw new Error("Περίμενα μία τιμή", this.current_token.position_start, this.current_token.position_end);
    }

    make_value() {
        if([TokenType.INTEGER, TokenType.REAL, TokenType.STRING, TokenType.BOOLEAN].includes(this.current_token.type)) {
            const node = new ValueNode(this.current_token);
            this.advance();

            return node;
        } else {
            throw new Error("Περίμενα μία τιμή", this.current_token.position_start, this.current_token.position_end);
        }
    }

    make_function_call() {
        const identifier_token = this.current_token;

        this.advance();
        if(this.current_token.type !== TokenType.LEFT_PARENTHESIS) {
            throw new Error("Περίμενα '('", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        const parameters = [];

        if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
            this.advance();
            return new FunctionCallNode(identifier_token, parameters);
        }
        parameters.push(this.make_expression());

        while(this.current_token.type === TokenType.COMMA) {
            this.advance();
            parameters.push(this.make_expression());
        }

        if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
            this.advance();
        }

        return new FunctionCallNode(identifier_token, parameters);
    }

    make_process_call() {
        this.advance();
        if(this.current_token.type !== TokenType.IDENTIFIER) {
            throw new Error("Περίμενα όνομα διαδικασίας");
        }

        const identifier_token = this.current_token;

        this.advance();
        if(this.current_token.type !== TokenType.LEFT_PARENTHESIS) {
            throw new Error("Περίμενα '('");
        }

        this.advance();
        const parameters = [];

        if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
            this.advance();
            return new ProcessCallNode(identifier_token, parameters);
        }

        parameters.push(this.make_expression());

        while(this.current_token.type === TokenType.COMMA) {
            this.advance();
            parameters.push(this.make_expression());
        }

        if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
            this.advance();
        }

        return new ProcessCallNode(identifier_token, parameters);
    }

    make_constant_definition_section() {
        const constants = [];
        const values = [];

        while(this.current_token.type === TokenType.NEWLINE) {
            this.advance();

            if(this.current_token.type !== TokenType.IDENTIFIER) {
                continue;
            }

            constants.push(this.current_token);
            this.advance();

            if(this.current_token.type !== TokenType.EQUALS) {
                throw new Error("Περίμενα =", this.current_token.position_start, this.current_token.position_end);
            }
    
            this.advance();
            values.push(this.make_value());
        }

        if(constants.length === 0) {
            throw new Error("Περίμενα δήλωση σταθερών", this.current_token.position_start, this.current_token.position_end);
        }

        const nodes = [];
        for(let i = 0; i<constants.length; i++) {
            nodes.push(new ValueDefinitionNode(constants[i], {value_node:values[i]}, false))
        }

        return new StatementsNode(nodes);
    }

    make_variable_definition_section() {
        const variables = [];
        while(this.current_token.type === TokenType.NEWLINE) {
            this.advance();

            if(this.current_token.type === TokenType.NEWLINE) {
                continue;
            }

            if(this.current_token.type !== TokenType.KEYWORD) {
                throw new Error("Περίμενα τύπο μεταβλητής", this.current_token.position_start, this.current_token.position_end)
            }

            if(this.current_token.value === "ΑΡΧΗ" || this.current_token.value === "ΜΕΤΑΒΛΗΤΕΣ" || this.current_token.value === "ΣΤΑΘΕΡΕΣ") {
                break;
            }

            let type;
            if(this.current_token.value === "ΑΚΕΡΑΙΕΣ") type = ValueType.INTEGER;
            else if(this.current_token.value === "ΠΡΑΓΜΑΤΙΚΕΣ") type = ValueType.REAL;
            else if(this.current_token.value === "ΧΑΡΑΚΤΗΡΕΣ") type = ValueType.STRING;
            else if(this.current_token.value === "ΛΟΓΙΚΕΣ") type = ValueType.BOOLEAN;
            else throw new Error("Περίμενα τύπο μεταβλητής", this.current_token.position_start, this.current_token.position_end)
            this.advance();

            if(this.current_token.type !== TokenType.SEMICOLON) {
                throw new Error("Περίμενα ':'", this.current_token.position_start, this.current_token.position_end);
            }

            this.advance();
            if(this.current_token.type !== TokenType.IDENTIFIER) {
                throw new Error("Περίμαν όνομα μεταβλητής", this.current_token.position_start, this.current_token.position_end);
            }

            variables.push({type, token: this.current_token});
            this.advance();

            while(this.current_token.type === TokenType.COMMA) {
                this.advance();

                if(this.current_token.type !== TokenType.IDENTIFIER) {
                    throw new Error("Περίμενα όνομα μεταβλητής", this.current_token.position_start, this.current_token.position_end);
                }

                variables.push({type, token: this.current_token});
                this.advance();
            }
        }

        if(variables.length === 0) {
            throw new Error("Περίμενα δήλωση μεταβλητών", this.current_token.position_start, this.current_token.position_end);
        }

        const nodes = [];
        for(let variable of variables) {
            nodes.push(new ValueDefinitionNode(variable.token, {type:variable.type}, true));
        }

        return new StatementsNode(nodes);
    }

    make_code_section(section_type = "ΠΡΟΓΡΑΜΜΑ", endkeyword = "ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ") {
        const node = this.make_statements((token) => token.type !== TokenType.KEYWORD || token.value !== endkeyword);
        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== endkeyword) {
            throw new Error(`${section_type} πρέπει να τελειώνει με ${endkeyword}`, this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        return node;
    }

    make_program_section() {
        if(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== "ΠΡΟΓΡΑΜΜΑ") {
            throw new Error("ΠΡΟΓΡΑΜΜΑ πρέπει να αρχίζει με 'ΠΡΟΓΡΑΜΜΑ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        if(this.current_token.type != TokenType.IDENTIFIER) {
            throw new Error("Περίμενα όνομα προγράμματος", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();
        while(this.current_token.type === TokenType.NEWLINE) {
            this.advance();
        }

        if(this.current_token.type !== TokenType.KEYWORD) {
            throw new Error("Περίμενα 'ΑΡΧΗ'", this.current_token.position_start, this.current_token.position_end);
        }

        let variableDefinitionSection;
        let constantDefinitionSection;

        while(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== "ΑΡΧΗ") {
            if(this.current_token.value === "ΜΕΤΑΒΛΗΤΕΣ") {
                if(variableDefinitionSection == undefined) {
                    this.advance();
                    variableDefinitionSection = this.make_variable_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί μεταβλητές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.value === "ΣΤΑΘΕΡΕΣ") {
                if(constantDefinitionSection == undefined) {
                    this.advance();
                    constantDefinitionSection = this.make_constant_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί σταθερές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.type === TokenType.NEWLINE) {
                this.advance();
                continue;
            }

            throw new Error("Περίμενα 'ΑΡΧΗ'", this.current_token.position_start, this.current_token.position_end);
        }

        this.advance();
        const statements = [];
        if(constantDefinitionSection != undefined) statements.push(constantDefinitionSection);
        if(variableDefinitionSection != undefined) statements.push(variableDefinitionSection);
        statements.push(this.make_code_section());

        return new StatementsNode(statements);
    }

    make_function_section() {
        this.advance();

        if(this.current_token.type != TokenType.IDENTIFIER) {
            throw new Error("Περίμενα όνομα συνάρτησης", this.current_token.position_start, this.current_token.position_end);
        }

        const identifier_token = this.current_token;
        this.advance();

        if(this.current_token.type !== TokenType.LEFT_PARENTHESIS) {
            throw new Error("Περίμενα '('", this.current_token.position_start, this.current_token.position_end)
        }
        this.advance();

        const parameters = [];
        while(this.current_token.type === TokenType.IDENTIFIER) {
            parameters.push(this.current_token);           
            this.advance();
            
            if(this.current_token.type === TokenType.COMMA) {
                this.advance();
                continue;
            } else if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
                break;
            } else {
                throw new Error("Περίμενα ')'", this.current_token.position_start, this.current_token.position_end);
            }
        }

        if(this.current_token.type !== TokenType.RIGHT_PARENTHESIS) {
            throw new Error("Περίμενα ')'", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();

        if(this.current_token.type !== TokenType.SEMICOLON) {
            throw new Error("Περίμενα ':'", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();

        if(this.current_token.type !== TokenType.KEYWORD) {
            throw new Error("Περίμενα τύπο συνάρτης", this.current_token.position_start, this.current_token.position_end)
        }

        let type;
        if(this.current_token.value === "ΑΚΕΡΑΙΑ") type = ValueType.INTEGER;
        else if(this.current_token.value === "ΠΡΑΓΜΑΤΙΚΗ") type = ValueType.REAL;
        else if(this.current_token.value === "ΧΑΡΑΚΤΗΡΑΣ") type = ValueType.STRING;
        else if(this.current_token.value === "ΛΟΓΙΚΗ") type = ValueType.BOOLEAN;
        else throw new Error("Περίμενα τύπο συνάρτησης", this.current_token.position_start, this.current_token.position_end)
        this.advance();

        let variableDefinitionSection;
        let constantDefinitionSection;

        while(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== "ΑΡΧΗ") {
            if(this.current_token.value === "ΜΕΤΑΒΛΗΤΕΣ") {
                if(variableDefinitionSection == undefined) {
                    this.advance();
                    variableDefinitionSection = this.make_variable_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί μεταβλητές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.value === "ΜΕΤΑΒΛΗΤΕΣ") {
                if(constantDefinitionSection == undefined) {
                    this.advance();
                    constantDefinitionSection = this.make_constant_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί σταθερές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.type === TokenType.NEWLINE) {
                this.advance();
                continue;
            }

            throw new Error("Περίμενα 'ΑΡΧΗ'", this.current_token.position_start, this.current_token.position_end)
        }

        this.advance();
        const codeSection = this.make_code_section("ΣΥΝΑΡΤΗΣΗ", "ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ");
        return new FunctionDefinitionNode(identifier_token, parameters, type, variableDefinitionSection, constantDefinitionSection, codeSection);
    }

    make_process_section() {
        this.advance();

        if(this.current_token.type != TokenType.IDENTIFIER) {
            throw new Error("Περίμενα όνομα διαδικασίας", this.current_token.position_start, this.current_token.position_end);
        }

        const identifier_token = this.current_token;
        this.advance();

        if(this.current_token.type !== TokenType.LEFT_PARENTHESIS) {
            throw new Error("Περίμενα '('", this.current_token.position_start, this.current_token.position_end)
        }
        this.advance();

        const parameters = [];
        while(this.current_token.type === TokenType.IDENTIFIER) {
            parameters.push(this.current_token);           
            this.advance();
            
            if(this.current_token.type === TokenType.COMMA) {
                this.advance();
                continue;
            } else if(this.current_token.type === TokenType.RIGHT_PARENTHESIS) {
                break;
            } else {
                throw new Error("Περίμενα ')'", this.current_token.position_start, this.current_token.position_end);
            }
        }

        if(this.current_token.type !== TokenType.RIGHT_PARENTHESIS) {
            throw new Error("Περίμενα ')'", this.current_token.position_start, this.current_token.position_end);
        }
        this.advance();

        let variableDefinitionSection;
        let constantDefinitionSection;

        while(this.current_token.type !== TokenType.KEYWORD || this.current_token.value !== "ΑΡΧΗ") {
            if(this.current_token.value === "ΜΕΤΑΒΛΗΤΕΣ") {
                if(variableDefinitionSection == undefined) {
                    this.advance();
                    variableDefinitionSection = this.make_variable_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί μεταβλητές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.value === "ΣΤΑΘΕΡΕΣ") {
                if(constantDefinitionSection == undefined) {
                    this.advance();
                    constantDefinitionSection = this.make_constant_definition_section();
                    continue;
                } else throw new Error("Είδη έχουν δηλωθεί σταθερές", this.current_token.position_start, this.current_token.position_end);
            } else if(this.current_token.type === TokenType.NEWLINE) {
                this.advance();
                continue;
            }

            throw new Error("Περίμενα 'ΑΡΧΗ'", this.current_token.position_start, this.current_token.position_end)
        }

        this.advance();
        const codeSection = this.make_code_section("ΔΙΑΔΙΚΑΣΙΑ", "ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ");
        return new ProcessDefinitionNode(identifier_token, parameters, variableDefinitionSection, constantDefinitionSection, codeSection);
    }

    parse(require_program = true) {
        try {
            const nodes = [];
            let programSectionNode;
            if(require_program) {
                programSectionNode = this.make_program_section();
            }

            while(this.current_token.type !== TokenType.EOF) {
                if(this.current_token.type === TokenType.KEYWORD) {
                    if(this.current_token.value === "ΣΥΝΑΡΤΗΣΗ") {
                        nodes.push(this.make_function_section());
                    } else if(this.current_token.value === "ΔΙΑΔΙΚΑΣΙΑ") {
                        nodes.push(this.make_process_section());
                    } else if(this.current_token.value === "ΠΡΟΓΡΑΜΜΑ") {
                        throw new Error("Είδη έχει δηλωθεί το πρόγραμμα", this.current_token.position_start, this.current_token.position_end);
                    } else throw new Error("Περίμενα συνάρτηση ή διαδικασία", this.current_token.position_start, this.current_token.position_end);
                } else if(this.current_token.type === TokenType.NEWLINE) {
                    this.advance();
                    continue;
                } else {
                    throw new Error("Περίμενα συνάρτηση ή διαδικασία", this.current_token.position_start, this.current_token.position_end);
                }
            }

            if(programSectionNode != undefined) {
                nodes.push(programSectionNode);
            }

            return {node: new StatementsNode(nodes)};
        } catch(error) {
            return {error};
        }
    }
};