import express from 'express';
import cors, { type CorsOptions } from 'cors';
import sequelize from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import './models/Task.js';
import taskRoutes from './routes/task.js';

const app = express();
const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://auth-app-green-pi.vercel.app',
];

function normalizeOrigin(origin: string): string | null {
    const trimmed = origin.trim();

    if (!trimmed) {
        return null;
    }

    try {
        return new URL(trimmed).origin;
    } catch {
        return null;
    }
}

function parseAllowedOrigins(): string[] {
    const configuredOrigins = [
        process.env.CLIENT_ORIGINS,
        process.env.CLIENT_ORIGIN,
        ...DEFAULT_ALLOWED_ORIGINS,
    ]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(','))
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => Boolean(origin));

    return [...new Set(configuredOrigins)];
}

const allowedOrigins = parseAllowedOrigins();

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
        const accepted = !origin
            ? true
            : normalizedOrigin !== null && allowedOrigins.includes(normalizedOrigin);

        console.log('[CORS] Request origin:', origin ?? '<none>');
        console.log('[CORS] Decision:', accepted ? 'accepted' : 'rejected');

        if (accepted) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/tasks', taskRoutes);

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(3001, () => {
            console.log('Server started on port 3001');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

void startServer();
