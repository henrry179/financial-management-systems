import { Request, Response, NextFunction } from 'express';

/**
 * URL Sanitizer Middleware
 * Handles URL encoding issues and prevents ERR_UNESCAPED_CHARACTERS errors
 */
export const urlSanitizer = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for unescaped characters in the URL
    const originalUrl = req.originalUrl;
    
    // Common problematic characters that should be encoded
    const problematicChars = /[^\x00-\x7F]|[<>{}|\\\^`\[\]]/;
    
    if (problematicChars.test(originalUrl)) {
      // Try to encode the URL properly
      try {
        const encodedUrl = encodeURI(decodeURI(originalUrl));
        req.url = encodedUrl.replace(req.baseUrl || '', '');
      } catch (error) {
        // If encoding fails, return a 400 error
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL_CHARACTERS',
            message: 'URL contains invalid characters. Please ensure the URL is properly encoded.',
            details: 'URL contains characters that must be percent-encoded.'
          }
        });
      }
    }

    // Sanitize query parameters
    if (req.query) {
      const sanitizedQuery: any = {};
      for (const [key, value] of Object.entries(req.query)) {
        try {
          // Ensure query parameter values are properly encoded
          if (typeof value === 'string') {
            sanitizedQuery[key] = decodeURIComponent(encodeURIComponent(value));
          } else {
            sanitizedQuery[key] = value;
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_QUERY_PARAMETER',
              message: `Invalid query parameter: ${key}`,
              details: 'Query parameter contains invalid characters.'
            }
          });
        }
      }
      req.query = sanitizedQuery;
    }

    next();
  } catch (error) {
    console.error('URL Sanitizer error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'URL_PROCESSING_ERROR',
        message: 'Error processing URL',
        details: 'An error occurred while processing the request URL.'
      }
    });
  }
};

/**
 * Request path validator to catch common URL encoding issues early
 */
export const validateRequestPath = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  try {
    // Test if the path can be properly decoded
    decodeURIComponent(path);
    next();
  } catch (error) {
    if (error instanceof URIError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MALFORMED_URL',
          message: 'The request URL is malformed',
          details: 'URL contains invalid percent-encoding sequences.'
        }
      });
    }
    next(error);
  }
}; 