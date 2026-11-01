import { FastifyRequest, FastifyReply } from 'fastify';
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export interface AuthUserPayload {
    id: string;
    email: string | null;
    name: string;
    role: 'TEACHER' | 'STUDENT' | 'GUEST';
}
declare module 'fastify' {
    interface FastifyRequest {
        authUser?: AuthUserPayload;
    }
}
export declare function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function requireRole(allowedRoles: ('TEACHER' | 'STUDENT' | 'GUEST')[]): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=auth.d.ts.map