import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 12;

const PASSWORD_CHAR_SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digit: '0123456789',
    special: '!@#$%^&*()_+-=[]{}',
};

export function generateRandomPassword(length = 16) {
    const groups = ['upper', 'lower', 'digit', 'special'];
    const pool = groups.map((g) => PASSWORD_CHAR_SETS[g]).join('');
    if (length < groups.length) length = groups.length;
    const chars = groups.map((g) => PASSWORD_CHAR_SETS[g][crypto.randomInt(PASSWORD_CHAR_SETS[g].length)]);
    while (chars.length < length) {
        chars.push(pool[crypto.randomInt(pool.length)]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

export async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
