import oqs
import base64
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class DilithiumSignature:
    """Dilithium Digital Signature wrapper"""
    
    def __init__(self, algorithm: str = "Dilithium2"):
        self.algorithm = algorithm
        self.sig = oqs.Signature(algorithm)
    
    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """Generate new Dilithium keypair"""
        try:
            public_key = self.sig.generate_keypair()
            private_key = self.sig.export_secret_key()
            return public_key, private_key
        except Exception as e:
            logger.error(f"Dilithium keypair generation failed: {e}")
            raise
    
    def sign(self, private_key: bytes, message: bytes) -> bytes:
        """Sign message with private key"""
        try:
            self.sig.secret_key = private_key
            signature = self.sig.sign(message)
            return signature
        except Exception as e:
            logger.error(f"Dilithium signing failed: {e}")
            raise
    
    def verify(self, public_key: bytes, message: bytes, signature: bytes) -> bool:
        """Verify signature with public key"""
        try:
            return self.sig.verify(message, signature, public_key)
        except Exception as e:
            logger.error(f"Dilithium verification failed: {e}")
            return False
    
    @staticmethod
    def encode_key(key: bytes) -> str:
        """Encode key to base64 string"""
        return base64.b64encode(key).decode('utf-8')
    
    @staticmethod
    def decode_key(key_str: str) -> bytes:
        """Decode base64 string to key bytes"""
        return base64.b64decode(key_str.encode('utf-8'))