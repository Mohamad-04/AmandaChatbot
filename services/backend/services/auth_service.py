"""
Authentication service for password hashing and verification.
Uses Werkzeug's security functions with PBKDF2-SHA256.
"""
from werkzeug.security import generate_password_hash, check_password_hash


def hash_password(password):
    """
    Hash a password using PBKDF2-SHA256.
    
    Args:
        password (str): Plain text password
        
    Returns:
        str: Hashed password
    """
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(password, password_hash):
    """
    Verify a password against a hash.
    
    Args:
        password (str): Plain text password to verify
        password_hash (str): Hash to verify against
        
    Returns:
        bool: True if password matches hash, False otherwise
    """
    return check_password_hash(password_hash, password)
