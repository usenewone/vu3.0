/**
 * Data validation and sanitization utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export class DataValidator {
  // Text validation and sanitization
  static validateText(value: string, maxLength: number = 10000): ValidationResult {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'string') {
      return { isValid: false, errors: ['Value must be a non-empty string'] };
    }
    
    // Check length
    if (value.length > maxLength) {
      errors.push(`Text must be ${maxLength} characters or less`);
    }
    
    // Sanitize HTML and dangerous content
    let sanitized = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
    
    // Basic XSS protection
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }
  
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      return { isValid: false, errors: ['Invalid email format'] };
    }
    
    return { isValid: true, errors: [], sanitizedValue: email.toLowerCase().trim() };
  }
  
  // URL validation
  static validateUrl(url: string): ValidationResult {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, errors: ['Only HTTP and HTTPS URLs are allowed'] };
      }
      
      return { isValid: true, errors: [], sanitizedValue: url };
    } catch {
      return { isValid: false, errors: ['Invalid URL format'] };
    }
  }
  
  // JSON validation
  static validateJson(data: any, maxSize: number = 1048576): ValidationResult {
    try {
      const jsonString = JSON.stringify(data);
      
      if (jsonString.length > maxSize) {
        return { isValid: false, errors: [`JSON data too large. Maximum ${maxSize} bytes allowed`] };
      }
      
      return { isValid: true, errors: [], sanitizedValue: data };
    } catch (error) {
      return { isValid: false, errors: ['Invalid JSON data'] };
    }
  }
  
  // Project data validation
  static validateProjectData(project: any): ValidationResult {
    const errors: string[] = [];
    
    if (!project.title || project.title.trim().length === 0) {
      errors.push('Project title is required');
    }
    
    if (project.title && project.title.length > 200) {
      errors.push('Project title must be 200 characters or less');
    }
    
    if (project.description && project.description.length > 5000) {
      errors.push('Project description must be 5000 characters or less');
    }
    
    const validCategories = ['Residential', 'Commercial', 'Hospitality', 'Office', 'Retail'];
    if (project.category && !validCategories.includes(project.category)) {
      errors.push('Invalid project category');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Education data validation
  static validateEducationData(education: any): ValidationResult {
    const errors: string[] = [];
    
    if (!education.institution || education.institution.trim().length === 0) {
      errors.push('Institution name is required');
    }
    
    if (!education.degree || education.degree.trim().length === 0) {
      errors.push('Degree is required');
    }
    
    if (!education.period || education.period.trim().length === 0) {
      errors.push('Period is required');
    }
    
    if (education.description && education.description.length > 2000) {
      errors.push('Description must be 2000 characters or less');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Image data validation
  static validateImageData(imageData: any): ValidationResult {
    const errors: string[] = [];
    
    if (!imageData.url) {
      errors.push('Image URL is required');
    } else {
      const urlValidation = this.validateUrl(imageData.url);
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors);
      }
    }
    
    if (!imageData.name || imageData.name.trim().length === 0) {
      errors.push('Image name is required');
    }
    
    if (imageData.description && imageData.description.length > 1000) {
      errors.push('Image description must be 1000 characters or less');
    }
    
    return { isValid: errors.length === 0, errors };
  }
}