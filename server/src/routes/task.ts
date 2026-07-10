import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import Task from "../models/Task.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tasks = await Task.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ tasks });
  } catch (error) {
    console.error("Fetch tasks failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, description, status, priority, dueDate } = req.body ?? {};

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    const task = await Task.create({
      title,
      description: description ?? null,
      status: status ?? "Pending",
      priority: priority ?? "Medium",
      dueDate: dueDate ?? null,
      userId,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const taskId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findOne({ where: { id: taskId, userId } });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, status, priority, dueDate } = req.body ?? {};

    if (title !== undefined && !title) {
      return res.status(400).json({ message: "title is required" });
    }

    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      dueDate: dueDate ?? task.dueDate,
    });

    return res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/complete", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const taskId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findOne({ where: { id: taskId, userId } });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.update({ status: "Completed" });

    return res.json({
      message: "Task marked as completed",
      task,
    });
  } catch (error) {
    console.error("Complete task failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const taskId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findOne({ where: { id: taskId, userId } });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
