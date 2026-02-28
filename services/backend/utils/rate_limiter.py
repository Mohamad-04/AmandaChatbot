"""
rate_limiter.py

This module implements a lightweight, in-memory rate limiting system
for both REST endpoints and WebSocket events.

WHY THIS EXISTS:
----------------
Rate limiting protects the backend from abuse, such as:
    - Brute-force login attempts
    - Signup spam
    - AI message flooding
    - Denial-of-service style behavior

This implementation:
    - Uses an in-memory sliding window algorithm
    - Does NOT require external dependencies
    - Works immediately in development
    - Can later be replaced with Redis for distributed environments

IMPORTANT:
----------
Because this uses in-memory storage:
    - Limits reset when the server restarts
    - Limits are not shared across multiple server instances
    - This is suitable for development / small deployments
    - For production scaling, use Redis or a centralized store
"""

import time  # Used to track request timestamps
from collections import defaultdict, deque  # Efficient timestamp storage
from dataclasses import dataclass  # Clean configuration container
from functools import wraps  # Preserve original function metadata
from typing import Callable, Deque, Dict

from flask import request, jsonify, session  # REST context
from flask_socketio import emit  # WebSocket event emission


@dataclass(frozen=True)
class RateLimit:
    """
    Defines a rate limit rule.

    max_requests: Maximum allowed requests
    window_seconds: Time window in seconds

    Example:
        RateLimit(5, 60) means:
            Max 5 requests in 60 seconds.
    """
    max_requests: int
    window_seconds: int


# Internal storage for tracking request timestamps.
# Structure:
#   key -> deque[timestamps]
#
# Each key represents a specific identity + scope combination.
# Example key:
#   "login:ip:192.168.1.5"
#
# We use deque because:
#   - Fast appends
#   - Fast pops from left (old timestamps)
_BUCKETS: Dict[str, Deque[float]] = defaultdict(deque)


def _client_ip() -> str:
    """
    Returns the client's IP address.

    NOTE:
    In production behind a proxy, you may need to safely
    read X-Forwarded-For instead.
    """
    return request.remote_addr or "unknown"


def _identity(identity: str) -> str:
    """
    Determines how a request should be identified.

    identity can be:
        - "user" → rate limit per authenticated user
        - "ip" → rate limit per IP address
        - custom string

    If identity="user":
        - Uses session["user_id"]
        - Falls back to IP if not logged in
    """
    if identity == "user":
        uid = session.get("user_id")
        return f"user:{uid}" if uid else f"ip:{_client_ip()}"

    if identity == "ip":
        return f"ip:{_client_ip()}"

    return identity  # Allows custom scopes if needed


def _is_limited(key: str, limit: RateLimit):
    """
    Core sliding window rate limiting logic.

    Steps:
        1. Remove timestamps outside time window
        2. Check if request count exceeds limit
        3. If allowed → record timestamp
        4. Return status

    Returns:
        (True, retry_after_seconds) if limited
        (False, None) if allowed
    """
    now = time.time()  # Current timestamp
    q = _BUCKETS[key]  # Get deque for this identity

    # Remove old timestamps outside allowed time window
    cutoff = now - limit.window_seconds
    while q and q[0] < cutoff:
        q.popleft()

    # If too many requests within window → block
    if len(q) >= limit.max_requests:
        retry_after = int(q[0] + limit.window_seconds - now) + 1
        return True, retry_after

    # Otherwise record this request
    q.append(now)
    return False, None


# =========================
# REST Rate Limiting
# =========================

def rate_limit(limit: RateLimit, *, identity: str = "ip", scope: str = "") -> Callable:
    """
    Decorator for REST endpoints.

    Usage example:

        @rate_limit(RateLimit(5, 60), identity="ip", scope="login")
        def login():
            ...

    identity:
        Controls whether limit is per IP or per user.

    scope:
        Separates limits between endpoints.
        Prevents login attempts from affecting signup limits.
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            ident = _identity(identity)

            # Key ensures each endpoint has separate tracking
            key = f"{scope or fn.__name__}:{ident}"

            limited, retry_after = _is_limited(key, limit)

            if limited:
                # HTTP 429 = Too Many Requests
                return (
                    jsonify({
                        "error": "rate_limited",
                        "message": "Too many requests. Please try again later.",
                        "retry_after_seconds": retry_after
                    }),
                    429,
                    {"Retry-After": str(retry_after)}
                )

            return fn(*args, **kwargs)

        return wrapper
    return decorator


# =========================
# WebSocket Rate Limiting
# =========================

def socket_rate_limit(limit: RateLimit, *, identity: str = "user", scope: str = "") -> Callable:
    """
    Decorator for WebSocket event handlers.

    Unlike REST:
        - We cannot return HTTP responses
        - We emit an error event instead

    Usage example:

        @socket_rate_limit(RateLimit(20, 60), identity="user", scope="chat_send")
        def handle_send_message(data):
            ...
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            ident = _identity(identity)
            key = f"{scope or fn.__name__}:{ident}"

            limited, retry_after = _is_limited(key, limit)

            if limited:
                # Emit error event instead of disconnecting user
                emit('error', {
                    'message': 'Too many messages. Please slow down.',
                    'retry_after_seconds': retry_after
                })
                return

            return fn(*args, **kwargs)

        return wrapper
    return decorator