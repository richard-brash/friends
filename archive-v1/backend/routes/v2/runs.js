import { Router } from 'express';
import { authenticateToken } from '../../src/middleware/auth.js';
import RunRepository from '../../repositories/runRepository.js';
import CleanRunService from '../../services/cleanRunService.js';

const router = Router();
const runService = new CleanRunService(new RunRepository());

// GET /api/v2/runs - List all runs with filters
router.get('/', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };

      const options = {
        includeTeam: req.query.includeTeam === 'true'
      };

      const runs = await runService.getAll(filters, options);
      
      res.json({
        success: true,
        data: runs,
        meta: {
          total: runs.length,
          filters: filters
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v2/runs/:id - Get single run with optional details
// Query params: includeTeam=true to include team members
router.get('/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      const options = {
        includeTeam: req.query.includeTeam === 'true'
      };
      
      const run = await runService.getById(req.params.id, options);
      
      res.json({
        success: true,
        data: run
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v2/runs - Create new run
router.post('/',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Add created_by from authenticated user
      const runData = {
        ...req.body,
        createdBy: req.user.id
      };

      const run = await runService.create(runData);
      
      res.status(201).json({
        success: true,
        data: run
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v2/runs/:id - Update run
router.put('/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      const run = await runService.update(req.params.id, req.body);
      
      res.json({
        success: true,
        data: run
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v2/runs/:id - Delete run
router.delete('/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      const run = await runService.delete(req.params.id);
      
      res.json({
        success: true,
        data: run
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v2/runs/:id/team-members - Get team members for a run
router.get('/:id/team-members',
  authenticateToken,
  async (req, res, next) => {
    try {
      const teamMembers = await runService.getTeamMembers(req.params.id);
      
      res.json({
        success: true,
        data: teamMembers
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v2/runs/:id/team-members - Add a team member to a run
router.post('/:id/team-members',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { userId } = req.body;
      const member = await runService.addTeamMember(req.params.id, userId);
      
      res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v2/runs/:id/team-members/:userId - Remove a team member from a run
router.delete('/:id/team-members/:userId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const member = await runService.removeTeamMember(req.params.id, req.params.userId);
      
      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;