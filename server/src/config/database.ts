import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME ?? "auth_app",
  process.env.DB_USER ?? "rohit",
  process.env.DB_PASSWORD ?? "./admin",
  {
    host: process.env.DB_HOST ?? "localhost",
    dialect: "mysql",
    logging: false,
  }
);

export default sequelize;