import jwt from "jsonwebtoken";

export const generateAccessToken=(userId, role)=>{
        // Admin tokens last 365 days (essentially infinite)
        // User tokens last 30 minutes
        const expiresIn = role === 'admin' ? '365d' : '30m';
        return jwt.sign({userId:userId, role:role},process.env.ACCESS_SECRET,{expiresIn})
}

export const generateRefreshToken=(userId, role)=>{
        // Admin refresh tokens last 365 days
        // User refresh tokens last 7 days
        const expiresIn = role === 'admin' ? '365d' : '7d';
        return jwt.sign({userId:userId, role:role},process.env.REFRESH_SECRET,{expiresIn})
}