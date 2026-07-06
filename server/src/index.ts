import express from 'express';
import sequelize from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);

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
