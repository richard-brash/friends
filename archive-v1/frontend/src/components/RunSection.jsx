import React, { useState } from 'react';
import RunsList from './runs/RunsList';
import CreateRunForm from './runs/CreateRunForm';
import RunOverview from './runs/RunOverview';

export default function RunSection() {
  const [view, setView] = useState('list'); // 'list', 'create', 'overview', 'edit'
  const [selectedRunId, setSelectedRunId] = useState(null);

  const handleCreateRun = () => {
    setView('create');
  };

  const handleViewRun = (runId) => {
    setSelectedRunId(runId);
    setView('overview');
  };

  const handleEditRun = (runId) => {
    setSelectedRunId(runId);
    setView('edit');
  };

  const handleRunCreated = (newRun) => {
    setView('list');
    // Optionally go to the new run's overview
    // setSelectedRunId(newRun.id);
    // setView('overview');
  };

  const handleCancel = () => {
    setView('list');
    setSelectedRunId(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedRunId(null);
  };

  switch (view) {
    case 'create':
    case 'edit':
      return (
        <CreateRunForm
          runId={view === 'edit' ? selectedRunId : null}
          onRunCreated={handleRunCreated}
          onCancel={handleCancel}
        />
      );

    case 'overview':
      return (
        <RunOverview
          runId={selectedRunId}
          onEdit={handleEditRun}
          onBack={handleBack}
        />
      );

    case 'list':
    default:
      return (
        <RunsList
          onCreateRun={handleCreateRun}
          onViewRun={handleViewRun}
          onEditRun={handleEditRun}
        />
      );
  }
}
