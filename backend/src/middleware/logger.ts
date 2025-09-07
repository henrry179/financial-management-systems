import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`➡️  ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (logBody[field]) {
        logBody[field] = '***HIDDEN***';
      }
    });
    
    console.log(`   Body: ${JSON.stringify(logBody)}`);
  }

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    const logSymbol = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(`${logSymbol} ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
    
    // Log errors
    if (statusCode >= 400 && data) {
      try {
        const responseData = JSON.parse(data);
        if (responseData.error) {
          console.log(`   Error: ${responseData.error.message}`);
        }
      } catch (e) {
        // Data is not JSON, skip error logging
      }
    }
    
    return originalSend.call(this, data);
  };

  next();
}; 