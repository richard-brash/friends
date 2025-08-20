import express from 'express';
const router = express.Router();
// TODO: Implement Friend CRUD endpoints
router.get('/', (req, res) => res.json({ friends: [] }));
export default router;
