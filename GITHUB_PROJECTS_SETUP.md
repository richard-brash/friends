# GitHub Projects Setup Guide

## Overview
This document outlines how to set up GitHub Projects for managing the Friends Outreach CRM development and maintenance.

## Project Board Structure

### Main Development Board: "Friends CRM Development"

#### Columns:
1. **📋 Backlog** - New issues and future enhancements
2. **🎯 Ready** - Issues that are ready to be worked on
3. **🔄 In Progress** - Currently being developed
4. **🧪 Testing** - Ready for testing/review
5. **✅ Done** - Completed and deployed

#### Labels System:
- **Priority Labels:**
  - `priority/critical` - Blocking issues
  - `priority/high` - Important improvements
  - `priority/medium` - Standard features
  - `priority/low` - Future enhancements

- **Type Labels:**
  - `bug` - Something isn't working
  - `enhancement` - New feature or request
  - `feedback` - User feedback and suggestions
  - `documentation` - Improvements to docs
  - `maintenance` - Code maintenance tasks

- **Component Labels:**
  - `frontend` - React/UI changes
  - `backend` - Node.js/API changes
  - `database` - PostgreSQL changes
  - `mobile` - Mobile-specific issues
  - `auth` - Authentication/security
  - `deployment` - Railway/deployment issues

- **User Role Labels:**
  - `user/admin` - Admin-specific features
  - `user/coordinator` - Coordinator workflow
  - `user/volunteer` - Volunteer experience
  - `user/all` - Affects all users

#### Issue Templates Integration:
- Bug reports automatically get `bug` label
- Feature requests get `enhancement` label
- Feedback gets `feedback` label
- Auto-assign to backlog column

## Setup Steps:

### 1. Create GitHub Project
1. Go to your repository: https://github.com/richard-brash/friends
2. Click "Projects" tab
3. Click "New Project"
4. Choose "Board" template
5. Name it "Friends CRM Development"

### 2. Configure Columns
Add the columns listed above with appropriate automation:
- New issues → Backlog
- Issues assigned → Ready
- PRs opened → In Progress
- PRs merged → Done

### 3. Create Labels
Go to Issues → Labels and create the labels listed above with appropriate colors.

### 4. Set Up Automation
Configure GitHub Actions for:
- Auto-labeling based on issue content
- Moving issues between columns
- Assigning reviewers for PRs

## Usage Workflow:

### For Users (Bug Reports/Feedback):
1. Click "Issues" on GitHub
2. Select appropriate template
3. Fill out template completely
4. Submit issue
5. Issue automatically appears in Backlog

### For Development:
1. Review Backlog regularly
2. Move important issues to Ready
3. Assign yourself when starting work
4. Move to In Progress
5. Create PR when ready
6. Move to Testing for review
7. Merge and move to Done

## Milestones:
Create milestones for major releases:
- v1.1 - User Management Improvements
- v1.2 - Mobile Experience Enhancements  
- v1.3 - Advanced Reporting Features
- v2.0 - Major Feature Release

## Benefits:
✅ **Organized Feedback** - All user input in one place
✅ **Priority Management** - Clear view of what's important
✅ **Progress Tracking** - Visual progress through development
✅ **User Engagement** - Users can see their feedback being addressed
✅ **Release Planning** - Milestone-based development cycles