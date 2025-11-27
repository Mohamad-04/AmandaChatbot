"""
WebSocket Server for Real-Time Voice Chat
Provides bidirectional audio streaming with minimal latency.
Runs separately from the main gRPC server.
"""
import asyncio
import logging
from aiohttp import web

from src.voice.voice_websocket_handler import setup_voice_websocket_routes
from src.config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def health_check(request: web.Request) -> web.Response:
    """Health check endpoint."""
    return web.json_response({'status': 'healthy', 'service': 'voice-server'})


async def create_app() -> web.Application:
    """
    Create and configure the aiohttp application.
    """
    app = web.Application()

    # Setup routes
    app.router.add_get('/health', health_check)

    # Setup voice WebSocket routes
    setup_voice_websocket_routes(app)

    # Enable CORS
    from aiohttp_cors import setup as setup_cors, ResourceOptions

    cors = setup_cors(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })

    # Configure CORS on all routes
    for route in list(app.router.routes()):
        if not isinstance(route.resource, web.StaticResource):
            cors.add(route)

    return app


def main():
    """
    Main entry point for the voice server.
    """
    # Get configuration
    host = '0.0.0.0'
    port = 8080  # Different port from main gRPC server

    print("=" * 60)
    print("Amanda Voice Server")
    print("=" * 60)
    print(f"WebSocket endpoint: ws://{host}:{port}/voice-stream")
    print(f"Health check: http://{host}:{port}/health")
    print("=" * 60)
    print()

    # Check if voice is enabled
    if not config.voice.get('enabled', False):
        logger.warning("Voice features are not enabled in config.yaml")
        logger.warning("Set voice.enabled = true to use voice chat")

    # Create and run app
    app_future = create_app()

    try:
        web.run_app(
            app_future,
            host=host,
            port=port,
            access_log=logger
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")


if __name__ == '__main__':
    main()
