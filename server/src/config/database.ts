import { Sequelize } from "sequelize";

const sequelize = new Sequelize("auth_app", "root", "./admin", {
  host: "localhost",
  dialect: "mysql",
});

export default sequelize;