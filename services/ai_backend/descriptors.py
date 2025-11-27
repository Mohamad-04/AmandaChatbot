"""
Dynamic protobuf descriptor definitions for the Amanda AI service.

This module creates Protocol Buffer message and service descriptors dynamically
without requiring .proto files or protoc compilation. This approach simplifies
deployment and makes the codebase more portable for educational purposes.
"""
from __future__ import annotations
from google.protobuf import descriptor_pb2, descriptor_pool, message_factory


def _build_file_descriptor() -> descriptor_pb2.FileDescriptorProto:
    """Build the file descriptor for amanda.ai service.
    
    This function programmatically creates the equivalent of:
    
    syntax = "proto3";
    package amanda.ai;
    
    message ChatMessage {
      string user_id = 1;
      string chat_id = 2;
      string message = 3;
    }
    
    message ChatChunk {
      string text = 1;
      bool done = 2;
    }
    
    service AIService {
      rpc StreamChat(ChatMessage) returns (stream ChatChunk);
    }
    """
    file_proto = descriptor_pb2.FileDescriptorProto()
    file_proto.name = "proto/ai.proto"
    file_proto.package = "amanda.ai"
    file_proto.syntax = "proto3"

    # Define ChatMessage
    chat_message = file_proto.message_type.add()
    chat_message.name = "ChatMessage"

    # ChatMessage.user_id field
    field = chat_message.field.add()
    field.name = "user_id"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING
    field.json_name = "userId"

    # ChatMessage.chat_id field
    field = chat_message.field.add()
    field.name = "chat_id"
    field.number = 2
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING
    field.json_name = "chatId"

    # ChatMessage.message field
    field = chat_message.field.add()
    field.name = "message"
    field.number = 3
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    # Define ChatChunk
    chat_chunk = file_proto.message_type.add()
    chat_chunk.name = "ChatChunk"

    # ChatChunk.text field
    field = chat_chunk.field.add()
    field.name = "text"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    # ChatChunk.done field
    field = chat_chunk.field.add()
    field.name = "done"
    field.number = 2
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_BOOL

    # Define AIService
    service = file_proto.service.add()
    service.name = "AIService"

    # AIService.StreamChat method
    method = service.method.add()
    method.name = "StreamChat"
    method.input_type = ".amanda.ai.ChatMessage"
    method.output_type = ".amanda.ai.ChatChunk"
    method.server_streaming = True

    return file_proto


# Create a global descriptor pool and add our file descriptor
_POOL = descriptor_pool.DescriptorPool()
_POOL.Add(_build_file_descriptor())


def chat_message_cls() -> type:
    """Return the dynamic protobuf ChatMessage class.
    
    Returns:
        type: The ChatMessage class that can be instantiated and used
              to create ChatMessage objects.
    
    Example:
        >>> ChatMessage = chat_message_cls()
        >>> msg = ChatMessage(user_id="123", chat_id="456", message="Hello")
    """
    descriptor = _POOL.FindMessageTypeByName("amanda.ai.ChatMessage")
    return message_factory.GetMessageClass(descriptor)


def chat_chunk_cls() -> type:
    """Return the dynamic protobuf ChatChunk class.
    
    Returns:
        type: The ChatChunk class that can be instantiated and used
              to create ChatChunk objects.
    
    Example:
        >>> ChatChunk = chat_chunk_cls()
        >>> chunk = ChatChunk(text="Hello", done=False)
    """
    descriptor = _POOL.FindMessageTypeByName("amanda.ai.ChatChunk")
    return message_factory.GetMessageClass(descriptor)


def get_service_descriptor():
    """Get the AIService descriptor for use with gRPC.
    
    Returns:
        ServiceDescriptor: The service descriptor for AIService
    """
    file_desc = _POOL.FindFileByName("proto/ai.proto")
    return file_desc.services_by_name["AIService"]


# For convenience, export the classes at module level
ChatMessage = chat_message_cls()
ChatChunk = chat_chunk_cls()
