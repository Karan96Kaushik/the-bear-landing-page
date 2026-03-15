import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { showProgressToast } from '../utils/toastHelpers';

function PollingBadge() {
  const navigate = useNavigate();
  const { pollingState } = useSelector(state => state.simulator);

  if (!pollingState.isActive) {
    return null;
  }

  const handleClick = () => {
    showProgressToast(pollingState.progress, pollingState.timeLeft);

    navigate('/simulator-v3');
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center gap-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-full transition-colors"
      title="Simulation in progress - Click to view"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-semibold">{pollingState.progress}%</span>
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </button>
  );
}

export default PollingBadge;
