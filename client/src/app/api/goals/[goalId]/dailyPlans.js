// pages/api/goals/[goalId]/daily-plans.ts
import axios from "axios";

export default async function handler(req, res) {
  const { goalId } = req.query;
  const backendUrl = process.env.BACKEND_URL;

  const response = await axios.post(`${backendUrl}/goals/${goalId}/daily-plans`);
  res.status(response.status).json(response.data);
}
