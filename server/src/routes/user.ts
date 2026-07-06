import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", (req, res) => {
  return res.json({ user: req.user });
});

export default router;
