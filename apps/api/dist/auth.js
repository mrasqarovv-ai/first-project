import bcrypt from 'bcryptjs';
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export async function authenticateToken(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Аутентификация токені қажет' });
        }
        const token = authHeader.substring(7);
        const decoded = request.server.jwt.verify(token);
        request.authUser = decoded;
    }
    catch (err) {
        return reply.status(401).send({ error: 'Жарамсыз немесе мерзімі өткен токен' });
    }
}
export function requireRole(allowedRoles) {
    return async (request, reply) => {
        if (!request.authUser) {
            return reply.status(401).send({ error: 'Жүйеге кіру қажет' });
        }
        if (!allowedRoles.includes(request.authUser.role)) {
            return reply.status(403).send({ error: 'Бұл әрекетке құқығыңыз жеткіліксіз' });
        }
    };
}
//# sourceMappingURL=auth.js.map