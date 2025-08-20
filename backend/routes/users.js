import express from 'express';
const router = express.Router();
// TODO: Implement User CRUD endpoints
router.get('/', (req, res) => res.json({ users: [] }));
export default router;
