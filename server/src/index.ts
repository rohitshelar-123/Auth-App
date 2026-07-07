import express from 'express';
import cors, { type CorsOptions } from 'cors';
import sequelize from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const corsOptions: CorsOptions = {
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        await User.sync();

        app.listen(3001, () => {
            console.log('Server started on port 3001');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

void startServer();
