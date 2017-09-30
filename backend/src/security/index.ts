import {hash, verify} from 'argon2';


export default new class Security {

    // number of passes
    public readonly timeCost = 4;
    // number of threads used
    public readonly parallelism = 2;
    // memory usage
    public readonly memoryCost = 12; // (2^12 kiB = 4 MiB)
    // minimum length of password
    private readonly minLength = 10;
    // required character classes in password
    private readonly characterClasses = [
        /[A-Z]/,
        /[a-z]/,
        /[0-9]/,
        /[^a-zA-Z0-9]/,
    ];

    public async hashPassword(password: string) {
        this.enforcePasswordPolicy(password);

        return hash(password, this);
    }

    public async verifyPassword(hashedPassword: string, clearCandidate: string) {
        return verify(hashedPassword, clearCandidate);
    }

    private enforcePasswordPolicy(password: string) {
        if (password.length < this.minLength) {
            throw new Error('Password too short');
        }

        this.characterClasses.forEach((charClass) => {
            if (!charClass.test(password)) {
                throw new Error(
                    'The password requires at least one upper case letter,' +
                    ' one lower case letter, one number, and one special character'
                );
            }
        });
    }
}();
