import oqs
import base64
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class KyberKEM:
    """Kyber Key Encapsulation Mechanism wrapper"""
    
    def __init__(self, algorithm: str = "Kyber512"):
        self.algorithm = algorithm
        self.kem = oqs.KeyEncapsulation(algorithm)
    
    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """Generate new Kyber keypair"""
        try:
            public_key = self.kem.generate_keypair()
            private_key = self.kem.export_secret_key()
            return public_key, private_key
        except Exception as e:
            logger.error(f"Kyber keypair generation failed: {e}")
            raise
    
    def encapsulate(self, public_key: bytes) -> Tuple[bytes, bytes]:
        """Encapsulate shared secret"""
        try:
            ciphertext, shared_secret = self.kem.encap_secret(public_key)
            return ciphertext, shared_secret
        except Exception as e:
            logger.error(f"Kyber encapsulation failed: {e}")
            raise
    
    def decapsulate(self, private_key: bytes, ciphertext: bytes) -> bytes:
        """Decapsulate shared secret"""
        try:
            self.kem.secret_key = private_key
            shared_secret = self.kem.decap_secret(ciphertext)
            return shared_secret
        except Exception as e:
            logger.error(f"Kyber decapsulation failed: {e}")
            raise
    
    @staticmethod
    def encode_key(key: bytes) -> str:
        """Encode key to base64 string"""
        return base64.b64encode(key).decode('utf-8')
    
    @staticmethod
    def decode_key(key_str: str) -> bytes:
        """Decode base64 string to key bytes"""
        return base64.b64decode(key_str.encode('utf-8'))