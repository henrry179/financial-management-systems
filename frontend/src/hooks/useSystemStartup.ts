import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface StartupStep {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  error?: string;
}

interface SystemStatus {
  isStarting: boolean;
  progress: number;
  currentStep: string;
  status: 'idle' | 'starting' | 'ready' | 'error';
  error?: string;
  steps: StartupStep[];
  backendStatus?: any;
}

const useSystemStartup = () => {
  const [status, setStatus] = useState<SystemStatus>({
    isStarting: true,
    progress: 0,
    currentStep: 'initializing',
    status: 'starting',
    steps: [],
  });

  const addStep = useCallback((name: string, description: string) => {
    const step: StartupStep = {
      name,
      description,
      status: 'pending',
    };
    setStatus(prev => ({
      ...prev,
      steps: [...prev.steps, step],
    }));
    return step;
  }, []);

  const updateStep = useCallback((stepName: string, updates: Partial<StartupStep>) => {
    setStatus(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.name === stepName ? { ...step, ...updates } : step
      ),
    }));
  }, []);

  const startStep = useCallback((stepName: string) => {
    updateStep(stepName, {
      status: 'in_progress',
      timestamp: new Date(),
    });
    setStatus(prev => ({
      ...prev,
      currentStep: stepName,
    }));
  }, [updateStep]);

  const completeStep = useCallback((stepName: string) => {
    setStatus(prev => {
      const steps = prev.steps.map(step => {
        if (step.name === stepName && step.timestamp) {
          return {
            ...step,
            status: 'completed',
            duration: Date.now() - step.timestamp.getTime(),
          };
        }
        return step;
      });

      const completed = steps.filter(s => s.status === 'completed').length;
      const total = steps.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...prev,
        steps,
        progress,
      };
    });
  }, []);

  const failStep = useCallback((stepName: string, error: string) => {
    updateStep(stepName, {
      status: 'failed',
      error,
    });
    setStatus(prev => ({
      ...prev,
      status: 'error',
      error,
    }));
  }, [updateStep]);

  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await apiService.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }, []);

  const checkBackendStartupStatus = useCallback(async () => {
    try {
      const response = await apiService.get('/api/v1/startup');
      return response.data;
    } catch (error) {
      console.warn('Backend startup status check failed:', error);
      return null;
    }
  }, []);

  const initializeSystem = useCallback(async () => {
    // Add initialization steps
    addStep('frontend_init', 'Initializing frontend application');
    addStep('backend_connection', 'Connecting to backend API');
    addStep('auth_check', 'Checking authentication status');
    addStep('data_loading', 'Loading initial data');
    addStep('ui_ready', 'Preparing user interface');

    try {
      // Step 1: Frontend initialization
      startStep('frontend_init');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate initialization
      completeStep('frontend_init');

      // Step 2: Backend connection
      startStep('backend_connection');
      const isBackendHealthy = await checkBackendHealth();
      if (!isBackendHealthy) {
        throw new Error('Backend service is not available');
      }
      
      const backendStatus = await checkBackendStartupStatus();
      setStatus(prev => ({ ...prev, backendStatus }));
      completeStep('backend_connection');

      // Step 3: Authentication check
      startStep('auth_check');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate auth check
      completeStep('auth_check');

      // Step 4: Data loading
      startStep('data_loading');
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate data loading
      completeStep('data_loading');

      // Step 5: UI readiness
      startStep('ui_ready');
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate UI preparation
      completeStep('ui_ready');

      // System is ready
      setStatus(prev => ({
        ...prev,
        isStarting: false,
        status: 'ready',
        progress: 100,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown startup error';
      failStep('backend_connection', errorMessage);
    }
  }, [addStep, startStep, completeStep, failStep, checkBackendHealth, checkBackendStartupStatus]);

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  const retryStartup = useCallback(() => {
    setStatus({
      isStarting: true,
      progress: 0,
      currentStep: 'initializing',
      status: 'starting',
      steps: [],
      error: undefined,
    });
    initializeSystem();
  }, [initializeSystem]);

  return {
    ...status,
    retryStartup,
  };
};

export default useSystemStartup;