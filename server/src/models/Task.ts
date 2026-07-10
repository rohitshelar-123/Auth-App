import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface TaskAttributes {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreationAttributes
  extends Optional<
    TaskAttributes,
    "id" | "description" | "status" | "priority" | "dueDate" | "createdAt" | "updatedAt"
  > {}

class Task
  extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes
{
  declare id: number;
  declare title: string;
  declare description: string | null;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare dueDate: Date | null;
  declare userId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
      allowNull: false,
      defaultValue: "Pending",
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
      defaultValue: "Medium",
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "tasks",
    modelName: "Task",
  }
);

Task.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Task, {
  foreignKey: "userId",
  as: "tasks",
});

export default Task;
