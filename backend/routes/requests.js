import express from 'express';
const router = express.Router();
// TODO: Implement Request CRUD endpoints
router.get('/', (req, res) => res.json({ requests: [] }));
export default router;
