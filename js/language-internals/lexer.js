export const digits = new Set([...'0123456789']);
export const legalCharacters = new Set([...'αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ1234567890_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']);

export const TokenType = Object.freeze([
    "INTEGER",
    "REAL",
    "BOOLEAN",
    "STRING",
    "PLUS",
    "MINUS",
    "MULTIPLY",
    "DIVIDE",
    "POWER",
    "SEMICOLON",
    "GREATER",
    "LESS",
    "LESS_OR_EQUAL",
    "GREATER_OR_EQUAL",
    "EQUALS",
    "NOT_EQUALS",
    "ASSIGN",
    "LEFT_PARENTHESIS",
    "RIGHT_PARENTHESIS",
    "COMMA",
    "NEWLINE",
    "IDENTIFIER",
    "KEYWORD",
    "EOF"
].reduce((a, v) => ({ ...a, [v]: v}), {}));

export const keywords = new Set([
   "ΑΚΕΡΑΙΑ",
   "ΑΚΕΡΑΙΕΣ",
   "ΠΡΑΓΜΑΤΙΚΗ",
   "ΠΡΑΓΜΑΤΙΚΕΣ",
   "ΧΑΡΑΚΤΗΡΑΣ",
   "ΧΑΡΑΚΤΗΡΕΣ",
   "ΛΟΓΙΚΗ",
   "ΛΟΓΙΚΕΣ",
   "DIV",
   "MOD",
   "ΟΧΙ",
   "ΚΑΙ",
   "Η",
   "ΑΝ",
   "ΤΟΤΕ",
   "ΑΛΛΙΩΣ_ΑΝ",
   "ΑΛΛΙΩΣ",
   "ΤΕΛΟΣ_ΑΝ",
   "ΓΙΑ",
   "ΑΠΟ",
   "ΜΕΧΡΙ",
   "ΜΕ_ΒΗΜΑ",
   "ΟΣΟ",
   "ΕΠΑΝΑΛΑΒΕ",
   "ΑΡΧΗ_ΕΠΑΝΑΛΗΨΗΣ",
   "ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ",
   "ΚΑΛΕΣΕ",
   "ΠΡΟΓΡΑΜΜΑ",
   "ΣΥΝΑΡΤΗΣΗ",
   "ΔΙΑΔΙΚΑΣΙΑ",
   "ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ",
   "ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ",
   "ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ",
   "ΑΡΧΗ",
   "ΜΕΤΑΒΛΗΤΕΣ",
   "ΣΤΑΘΕΡΕΣ",
   "ΓΡΑΨΕ",
   "ΔΙΑΒΑΣΕ",
   "ΜΕΧΡΙΣ_ΟΤΟΥ"
]);

export class Position {
    constructor(index, row, column) {
        this.index = index;
        this.row = row;
        this.column = column;
    }

    cloneHorizontalOffset(amount) {
        return new Position(this.index + amount, this.row, this.column + amount);
    }
};

export class Error {
    constructor(message, position_start, position_end, internal = false) {
        if(!internal) {
            this.glogloglossa_error = true;
        }

        this.message = message;
        this.position_start = position_start;
        this.position_end = position_end;
    }

    hasPosition() {
        return this.position_start != undefined && this.position_end != undefined;
    }
};

export class Token {
    constructor(type, position_start, position_end, value = null) {
        this.type = type;
        this.value = value;
        this.position_start = position_start;
        this.position_end = position_end;
    }

    toString() {
        if(this.value === null) return `${this.type}`;
        return `${this.type}:${this.value.toString()}`
    }
};

export default class Lexer {
    constructor(text) {
        this.text = text;
        this.current_position = new Position(-1, 0,-1);
        this.current_character = null;

        this.advance();
    }

    advance() {
        this.current_position = this.current_position.cloneHorizontalOffset(1);
        if(this.text.length <= this.current_position.index) {
            this.current_character = null;
            return;
        }

        this.current_character = this.text[this.current_position.index];
        if(this.current_character === '\n') {
            this.current_position.column = -1;
            this.current_position.row++;
        }
    }

    make_number_token() {
        const startPosition = this.current_position;
        let endPosition;

        let numberString = '';
        let isInteger = true;

        while(this.current_character != null && (this.current_character === '.' || digits.has(this.current_character))) {
            numberString += this.current_character;

            if(this.current_character === '.') {
                if(isInteger) {
                    isInteger = false;
                } else {
                    throw new Error(`Περίμενα αριθμό, έλαβα '${numberString}'`, startPosition, this.current_position.cloneHorizontalOffset(1));
                }
            }

            endPosition = this.current_position.cloneHorizontalOffset(1);
            this.advance();
        }

        return new Token(isInteger ? TokenType.INTEGER : TokenType.REAL, startPosition, endPosition, Number(numberString));
    }

    make_string_token() {
        const start_position = this.current_position;
        let string = '';

        this.advance();
        while(this.current_character != null) {
            if(this.current_character === '"') {
                break;
            }

            string += this.current_character;
            this.advance();
        }

        if(this.current_character === null) {
            throw new Error("Η σταθερά χαρακτήρων δεν τελειώνει", start_position, this.current_position);
        }

        const token = new Token(TokenType.STRING, start_position, this.current_position.cloneHorizontalOffset(1), string);
        this.advance();
        return token;
    }

    make_identifier_token() {
        const startPosition = this.current_position;
        let endPosition = this.current_position;
        let string = '';

        while(this.current_character != null && legalCharacters.has(this.current_character)) {
            string += this.current_character;
            endPosition = this.current_position;
            this.advance();
        }

        if(string === 'ΑΛΗΘΗΣ' || string === 'ΨΕΥΔΗΣ') {
            return new Token(TokenType.BOOLEAN, startPosition, this.current_position, string === 'ΑΛΗΘΗΣ');
        }

        const token = new Token(keywords.has(string) ? TokenType.KEYWORD : TokenType.IDENTIFIER, startPosition, endPosition.cloneHorizontalOffset(1), string);
        return token;
    }

    make_less_token() {
        let token = new Token(TokenType.LESS, this.current_position, this.current_position.cloneHorizontalOffset(1));
        this.advance();

        if(this.current_character === '=') {
            token = new Token(TokenType.LESS_OR_EQUAL, token.position_start, this.current_position.cloneHorizontalOffset(1));
        } else if(this.current_character === '>') {
            token = new Token(TokenType.NOT_EQUALS, token.position_start, this.current_position.cloneHorizontalOffset(1));
        } else if(this.current_character === '-') {
            token = new Token(TokenType.ASSIGN, token.position_start, this.current_position.cloneHorizontalOffset(1));
        }

        this.advance();
        return token;
    }

    make_greater_token() {
        let token = new Token(TokenType.GREATER, this.current_position, this.current_position.cloneHorizontalOffset(1));
        this.advance();

        if(this.current_character === '=') {
            token = new Token(TokenType.GREATER_OR_EQUAL, token.position_start, this.current_position);
        }

        this.advance();
        return token;
    }

    make_tokens() {
        const tokens = [];
        const result = {tokens};

        while(this.current_character != null) {
            if(this.current_character === ' ') {
                this.advance();
                continue;
            }

            try {
                if(this.current_character === '+') {
                    tokens.push(new Token(TokenType.PLUS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '-') {
                    tokens.push(new Token(TokenType.MINUS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '*') {
                    tokens.push(new Token(TokenType.MULTIPLY, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '/') {
                    tokens.push(new Token(TokenType.DIVIDE, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '^') {
                    tokens.push(new Token(TokenType.POWER, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '<') {
                    tokens.push(this.make_less_token());
                } else if(this.current_character === '>') {
                    tokens.push(this.make_greater_token());
                } else if(this.current_character === '=') {
                    tokens.push(new Token(TokenType.EQUALS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '(') {
                    tokens.push(new Token(TokenType.LEFT_PARENTHESIS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === ')') {
                    tokens.push(new Token(TokenType.RIGHT_PARENTHESIS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === ',') {
                    tokens.push(new Token(TokenType.COMMA, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '-') {
                    tokens.push(new Token(TokenType.MINUS, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === ':') {
                    tokens.push(new Token(TokenType.SEMICOLON, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(this.current_character === '\n') {
                    tokens.push(new Token(TokenType.NEWLINE, this.current_position, this.current_position.cloneHorizontalOffset(1)));
                    this.advance();
                } else if(digits.has(this.current_character)) {
                    tokens.push(this.make_number_token());
                } else if(this.current_character === '"') {
                    tokens.push(this.make_string_token());
                } else if(legalCharacters.has(this.current_character)) {
                    tokens.push(this.make_identifier_token());
                } else {
                    throw new Error("Μη δεκτός χαρακτήρας '" + this.current_character + "'", this.current_position, this.current_position.cloneHorizontalOffset(1));
                }
            } catch(error) {
                result.error = error;
                break;
            }
        }
        
        tokens.push(new Token(TokenType.EOF, null, null));
        return result;
    }
};