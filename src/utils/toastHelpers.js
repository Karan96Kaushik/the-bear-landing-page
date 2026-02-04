import { toast } from 'react-hot-toast';
import React from 'react';

/**
 * Show error toast with Retry and Clear action buttons
 */
export const showErrorToastWithActions = (error, dispatch, retryAction, clearAction, retryDelay = 0) => {
  const message = error?.message || 'An error occurred';
  
  toast.error(
    (t) => (
      <div className="flex flex-col gap-2">
        <div className="font-semibold">{message}</div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              dispatch(retryAction());
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={retryDelay > 0}
          >
            {retryDelay > 0 ? `Retry (${Math.ceil(retryDelay / 1000)}s)` : 'Retry'}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              dispatch(clearAction());
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
    ),
    {
      duration: retryDelay > 0 ? retryDelay : 10000,
      style: {
        minWidth: '300px',
      }
    }
  );
};

/**
 * Show success toast
 */
export const showSuccessToast = (message) => {
  toast.success(message);
};

/**
 * Show info toast
 */
export const showInfoToast = (message, options = {}) => {
  toast(message, {
    icon: '🔍',
    style: {
      background: '#abb53f',
      color: 'black'
    },
    ...options
  });
};

/**
 * Show progress toast with custom styling
 */
export const showProgressToast = (progress, timeLeft) => {
  toast(`Simulation running: (${progress}%) | ${timeLeft.minutes}m ${timeLeft.seconds}s left`, {
    duration: 3000,
    icon: '🔍',
    style: {
      background: '#abb53f',
      color: 'black'
    }
  });
};
