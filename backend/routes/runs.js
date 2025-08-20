import express from 'express';
const router = express.Router();
// TODO: Implement Run CRUD endpoints
router.get('/', (req, res) => res.json({ runs: [] }));
export default router;
