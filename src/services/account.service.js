import { generateRandomPassword } from '../utils/password.js';
import { sendMail } from '../utils/mailer.js';

export async function resolveAccountPassword(email, suppliedPassword, roleLabel) {
    const generated = !suppliedPassword;
    const password = suppliedPassword || generateRandomPassword();

    if (generated) {
        await sendMail({
            to: email,
            subject: 'Your OCMS account has been created',
            text: `A ${roleLabel} account has been created for you on OCMS.\n\nUse the temporary password below to sign in:\n\n${password}\n\nChange it from your Settings after signing in.`,
        });
    }

    return { password, generated };
}