import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    req.user = payload;
    console.log('Token decoded successfully:', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hasPermissions: !!payload.permissions,
      permissionsCount: payload.permissions?.length || 0
    });
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token', message: err.message });
  }
}

// Optional auth - verifies token if present, but doesn't fail if missing
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
      req.user = payload;
    } catch (err) {
      // Invalid token, but continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log('Role check failed:', {
        userRole: req.user.role,
        requiredRoles: roles,
        user: req.user
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}, Your role: ${req.user.role}`
      });
    }
    
    next();
  };
}

// Check if user has required permissions
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Admin has all permissions - bypass check
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For staff, check if they have the required permissions
    if (req.user.role === 'staff') {
      const userPermissions = req.user.permissions || [];
      
      // Check if staff has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        console.log('Permission check failed:', {
          required: requiredPermissions,
          userPermissions: userPermissions,
          userRole: req.user.role
        });
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'You do not have the required permissions to access this resource',
          required: requiredPermissions,
          yourPermissions: userPermissions
        });
      }
      
      return next();
    }
    
    // For other roles, deny access
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access denied for this role' 
    });
  };
}







