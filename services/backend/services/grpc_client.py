"""
gRPC client for communicating with the AI Backend service.
Handles streaming chat responses from the Amanda AI service.
"""
import sys
import os
from typing import Generator
import grpc

# Add ai_backend to path to import descriptors
ai_backend_path = os.path.join(os.path.dirname(__file__), '../../ai_backend')
sys.path.insert(0, ai_backend_path)

try:
    from descriptors import ChatMessage, ChatChunk, get_service_descriptor
except ImportError as e:
    raise ImportError(
        f"Failed to import AI backend descriptors. "
        f"Make sure ai_backend/descriptors.py exists. Error: {e}"
    )


class GRPCClient:
    """
    Client for communicating with Amanda AI Backend via gRPC.
    
    This client handles:
    - Connection management to the gRPC server
    - Streaming chat requests
    - Error handling and reconnection
    """
    
    def __init__(self, host='localhost', port=50051):
        """
        Initialize the gRPC client.
        
        Args:
            host (str): AI backend host address
            port (int): AI backend port number
        """
        self.host = host
        self.port = port
        self.address = f'{host}:{port}'
        self._channel = None
        self._stub = None
    
    def _ensure_connection(self):
        """
        Ensure we have an active connection to the gRPC server.
        Creates a new connection if one doesn't exist.
        """
        if self._channel is None:
            # Create an insecure channel (for development)
            # In production, use secure channel with SSL/TLS
            self._channel = grpc.insecure_channel(self.address)
            
            # Create a generic stub for making RPC calls
            self._stub = self._channel
    
    def close(self):
        """Close the gRPC connection."""
        if self._channel:
            self._channel.close()
            self._channel = None
            self._stub = None
    
    def stream_chat(self, user_id: str, chat_id: str, message: str) -> Generator[str, None, None]:
        """
        Stream a chat message to the AI backend and yield response chunks.
        
        This method sends a message to the AI and yields text chunks as they
        are received. This enables real-time streaming of the AI's response.
        
        Args:
            user_id (str): ID of the user sending the message
            chat_id (str): ID of the chat conversation
            message (str): The message text from the user
            
        Yields:
            str: Text chunks from the AI response
            
        Raises:
            grpc.RpcError: If the gRPC call fails
            
        Example:
            >>> client = GRPCClient()
            >>> for chunk in client.stream_chat("user123", "chat456", "Hello!"):
            ...     print(chunk, end='', flush=True)
            Hello! How can I help you today?
        """
        self._ensure_connection()
        
        # Create the request message
        request = ChatMessage(
            user_id=str(user_id),
            chat_id=str(chat_id),
            message=message
        )
        
        try:
            # Make the streaming RPC call
            # We need to call the StreamChat method on the AIService
            response_stream = self._channel.unary_stream(
                '/amanda.ai.AIService/StreamChat',
                request_serializer=ChatMessage.SerializeToString,
                response_deserializer=ChatChunk.FromString,
            )(request)
            
            # Yield text chunks until done
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
                if chunk.done:
                    break
                    
        except grpc.RpcError as e:
            # Log the error and re-raise
            print(f"gRPC error: {e.code()} - {e.details()}")
            raise
    
    def __enter__(self):
        """Context manager entry."""
        self._ensure_connection()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
        return False
