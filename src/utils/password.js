import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
