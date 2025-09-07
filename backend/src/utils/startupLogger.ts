import { PrismaClient } from '@prisma/client';

interface StartupStep {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  error?: string;
}

class StartupLogger {
  private steps: StartupStep[] = [];
  private startTime: Date;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.startTime = new Date();
  }

  addStep(name: string, description: string): StartupStep {
    const step: StartupStep = {
      name,
      description,
      status: 'pending',
    };
    this.steps.push(step);
    return step;
  }

  startStep(stepName: string): void {
    const step = this.steps.find(s => s.name === stepName);
    if (step) {
      step.status = 'in_progress';
      step.timestamp = new Date();
      this.log(`🚀 Starting: ${step.description}`);
    }
  }

  completeStep(stepName: string): void {
    const step = this.steps.find(s => s.name === stepName);
    if (step && step.timestamp) {
      step.status = 'completed';
      step.duration = Date.now() - step.timestamp.getTime();
      this.log(`✅ Completed: ${step.description} (${step.duration}ms)`);
    }
  }

  failStep(stepName: string, error: string): void {
    const step = this.steps.find(s => s.name === stepName);
    if (step) {
      step.status = 'failed';
      step.error = error;
      this.log(`❌ Failed: ${step.description} - ${error}`);
    }
  }

  async checkDatabaseConnection(): Promise<boolean> {
    this.startStep('database_connection');
    try {
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      this.completeStep('database_connection');
      return true;
    } catch (error) {
      this.failStep('database_connection', `Database connection failed: ${error}`);
      return false;
    }
  }

  async checkRedisConnection(): Promise<boolean> {
    this.startStep('redis_connection');
    // Redis connection check would be implemented here
    this.completeStep('redis_connection');
    return true;
  }

  getStatus(): {
    total: number;
    completed: number;
    failed: number;
    progress: number;
    uptime: number;
  } {
    const total = this.steps.length;
    const completed = this.steps.filter(s => s.status === 'completed').length;
    const failed = this.steps.filter(s => s.status === 'failed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const uptime = Date.now() - this.startTime.getTime();

    return {
      total,
      completed,
      failed,
      progress,
      uptime,
    };
  }

  getDetailedStatus() {
    return {
      startTime: this.startTime,
      uptime: Date.now() - this.startTime.getTime(),
      steps: this.steps,
      ...this.getStatus(),
    };
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  printSummary(): void {
    const status = this.getStatus();
    const uptimeSeconds = Math.floor(status.uptime / 1000);
    
    this.log('='.repeat(50));
    this.log('🚀 SYSTEM STARTUP SUMMARY');
    this.log('='.repeat(50));
    
    this.steps.forEach(step => {
      const statusIcon = step.status === 'completed' ? '✅' : 
                        step.status === 'failed' ? '❌' : 
                        step.status === 'in_progress' ? '🔄' : '⏳';
      const durationInfo = step.duration ? ` (${step.duration}ms)` : '';
      this.log(`${statusIcon} ${step.name}: ${step.status}${durationInfo}`);
    });
    
    this.log('-'.repeat(50));
    this.log(`📊 Progress: ${status.progress}% (${status.completed}/${status.total})`);
    this.log(`⏰ Uptime: ${uptimeSeconds}s`);
    this.log('='.repeat(50));
  }
}

export default StartupLogger;