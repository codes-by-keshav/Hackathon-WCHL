import oqs
import json
import base64
import sys
import argparse
from typing import Tuple, Dict, Optional
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PQCBridge:
    """Bridge for Post-Quantum Cryptography operations using liboqs"""
    
    def __init__(self):
        self.kyber_algorithm = "Kyber512"
        self.dilithium_algorithm = "Dilithium2"
    
    def generate_kyber_keypair(self) -> Dict[str, str]:
        """Generate Kyber KEM keypair for encryption"""
        try:
            kem = oqs.KeyEncapsulation(self.kyber_algorithm)
            public_key = kem.generate_keypair()
            private_key = kem.export_secret_key()
            
            return {
                "publicKey": base64.b64encode(public_key).decode('utf-8'),
                "privateKey": base64.b64encode(private_key).decode('utf-8')
            }
        except Exception as e:
            logger.error(f"Error generating Kyber keypair: {e}")
            raise
    
    def generate_dilithium_keypair(self) -> Dict[str, str]:
        """Generate Dilithium signature keypair"""
        try:
            sig = oqs.Signature(self.dilithium_algorithm)
            public_key = sig.generate_keypair()
            private_key = sig.export_secret_key()
            
            return {
                "publicKey": base64.b64encode(public_key).decode('utf-8'),
                "privateKey": base64.b64encode(private_key).decode('utf-8')
            }
        except Exception as e:
            logger.error(f"Error generating Dilithium keypair: {e}")
            raise
    
    def kyber_encapsulate(self, public_key: str) -> Dict[str, str]:
        """Encapsulate a shared secret using Kyber public key"""
        try:
            kem = oqs.KeyEncapsulation(self.kyber_algorithm)
            public_key_bytes = base64.b64decode(public_key.encode('utf-8'))
            
            ciphertext, shared_secret = kem.encap_secret(public_key_bytes)
            
            return {
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
                "sharedSecret": base64.b64encode(shared_secret).decode('utf-8')
            }
        except Exception as e:
            logger.error(f"Error in Kyber encapsulation: {e}")
            raise
    
    def kyber_decapsulate(self, private_key: str, ciphertext: str) -> str:
        """Decapsulate shared secret using Kyber private key"""
        try:
            kem = oqs.KeyEncapsulation(self.kyber_algorithm)
            private_key_bytes = base64.b64decode(private_key.encode('utf-8'))
            ciphertext_bytes = base64.b64decode(ciphertext.encode('utf-8'))
            
            kem.secret_key = private_key_bytes
            shared_secret = kem.decap_secret(ciphertext_bytes)
            
            return base64.b64encode(shared_secret).decode('utf-8')
        except Exception as e:
            logger.error(f"Error in Kyber decapsulation: {e}")
            raise
    
    def dilithium_sign(self, private_key: str, message: str) -> str:
        """Sign message using Dilithium private key"""
        try:
            sig = oqs.Signature(self.dilithium_algorithm)
            private_key_bytes = base64.b64decode(private_key.encode('utf-8'))
            message_bytes = message.encode('utf-8')
            
            sig.secret_key = private_key_bytes
            signature = sig.sign(message_bytes)
            
            return base64.b64encode(signature).decode('utf-8')
        except Exception as e:
            logger.error(f"Error in Dilithium signing: {e}")
            raise
    
    def dilithium_verify(self, public_key: str, message: str, signature: str) -> bool:
        """Verify Dilithium signature"""
        try:
            sig = oqs.Signature(self.dilithium_algorithm)
            public_key_bytes = base64.b64decode(public_key.encode('utf-8'))
            message_bytes = message.encode('utf-8')
            signature_bytes = base64.b64decode(signature.encode('utf-8'))
            
            return sig.verify(message_bytes, signature_bytes, public_key_bytes)
        except Exception as e:
            logger.error(f"Error in Dilithium verification: {e}")
            return False
    
    def create_challenge(self, user_id: str) -> Dict[str, str]:
        """Create authentication challenge for user"""
        import uuid
        import time
        
        challenge_data = {
            "user_id": user_id,
            "challenge_id": str(uuid.uuid4()),
            "timestamp": str(int(time.time())),
            "nonce": base64.b64encode(oqs.randombytes(32)).decode('utf-8')
        }
        
        challenge_message = json.dumps(challenge_data, sort_keys=True)
        
        return {
            "challenge": challenge_message,
            "challenge_id": challenge_data["challenge_id"]
        }

# Flask API for PQC operations
app = Flask(__name__)
CORS(app)
pqc = PQCBridge()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "algorithms": {"kyber": pqc.kyber_algorithm, "dilithium": pqc.dilithium_algorithm}})

@app.route('/generate-kyber-keypair', methods=['POST'])
def generate_kyber_keypair():
    try:
        result = pqc.generate_kyber_keypair()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/generate-dilithium-keypair', methods=['POST'])
def generate_dilithium_keypair():
    try:
        result = pqc.generate_dilithium_keypair()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/kyber-encapsulate', methods=['POST'])
def kyber_encapsulate():
    try:
        data = request.get_json()
        result = pqc.kyber_encapsulate(data['publicKey'])
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/kyber-decapsulate', methods=['POST'])
def kyber_decapsulate():
    try:
        data = request.get_json()
        result = pqc.kyber_decapsulate(data['privateKey'], data['ciphertext'])
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/kyber/validate-key', methods=['POST'])
def validate_kyber_key():
    try:
        logger.info("🔍 Kyber validation endpoint hit")
        data = request.get_json()
        logger.info(f"🔍 Request data keys: {list(data.keys()) if data else 'None'}")
        
        if not data:
            logger.error("❌ No JSON data received")
            return jsonify({"success": True, "valid": False, "error": "No data provided"}), 400
            
        public_key = data.get('publicKey')
        logger.info(f"🔍 Public key present: {public_key is not None}")
        logger.info(f"🔍 Public key length: {len(public_key) if public_key else 'None'}")
        
        if not public_key:
            logger.error("❌ No publicKey field in request")
            return jsonify({"success": True, "valid": False, "error": "No public key provided"})
        
        # Try to decode the base64 key to validate format
        try:
            public_key_bytes = base64.b64decode(public_key.encode('utf-8'))
            logger.info(f"🔍 Base64 decode successful, decoded length: {len(public_key_bytes)}")
        except Exception as decode_error:
            logger.error(f"❌ Base64 decode error: {decode_error}")
            return jsonify({"success": True, "valid": False, "error": "Invalid base64 encoding"})
        
        # Check if the key length matches Kyber512 public key size (800 bytes)
        key_length = len(public_key_bytes)
        logger.info(f"🔍 Kyber key validation: length={key_length}, expected=800±5")
        
        if 795 <= key_length <= 805:  # Allow 5 byte tolerance
            logger.info("✅ Kyber key validation successful")
            return jsonify({"success": True, "valid": True})
        else:
            logger.warning(f"❌ Kyber key validation failed: expected ~800 bytes, got {key_length} bytes")
            return jsonify({"success": True, "valid": False, "actualLength": key_length, "expectedRange": "795-805"})
            
    except Exception as e:
        logger.error(f"❌ Kyber key validation error: {e}")
        return jsonify({"success": True, "valid": False, "error": str(e)})

@app.route('/dilithium/validate-key', methods=['POST'])
def validate_dilithium_key():
    try:
        logger.info("🔍 Dilithium validation endpoint hit")
        data = request.get_json()
        logger.info(f"🔍 Request data keys: {list(data.keys()) if data else 'None'}")
        
        if not data:
            logger.error("❌ No JSON data received")
            return jsonify({"success": True, "valid": False, "error": "No data provided"}), 400
            
        public_key = data.get('publicKey')
        logger.info(f"🔍 Public key present: {public_key is not None}")
        logger.info(f"🔍 Public key length: {len(public_key) if public_key else 'None'}")
        
        if not public_key:
            logger.error("❌ No publicKey field in request")
            return jsonify({"success": True, "valid": False, "error": "No public key provided"})
        
        # Try to decode the base64 key to validate format
        try:
            public_key_bytes = base64.b64decode(public_key.encode('utf-8'))
            logger.info(f"🔍 Base64 decode successful, decoded length: {len(public_key_bytes)}")
        except Exception as decode_error:
            logger.error(f"❌ Base64 decode error: {decode_error}")
            return jsonify({"success": True, "valid": False, "error": "Invalid base64 encoding"})
        
        # Check if the key length matches Dilithium2 public key size (1312 bytes)
        key_length = len(public_key_bytes)
        logger.info(f"🔍 Dilithium key validation: length={key_length}, expected=1312±8")
        
        if 1304 <= key_length <= 1320:  # Allow some tolerance
            logger.info("✅ Dilithium key validation successful")
            return jsonify({"success": True, "valid": True})
        else:
            logger.warning(f"❌ Dilithium key validation failed: expected ~1312 bytes, got {key_length} bytes")
            return jsonify({"success": True, "valid": False, "actualLength": key_length, "expectedRange": "1304-1320"})
            
    except Exception as e:
        logger.error(f"❌ Dilithium key validation error: {e}")
        return jsonify({"success": True, "valid": False, "error": str(e)})



@app.route('/dilithium-sign', methods=['POST'])
def dilithium_sign():
    try:
        data = request.get_json()
        result = pqc.dilithium_sign(data['privateKey'], data['message'])
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/dilithium-verify', methods=['POST'])
def dilithium_verify():
    try:
        data = request.get_json()
        result = pqc.dilithium_verify(data['publicKey'], data['message'], data['signature'])
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/create-challenge', methods=['POST'])
def create_challenge():
    try:
        data = request.get_json()
        result = pqc.create_challenge(data['userId'])
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def main():
    parser = argparse.ArgumentParser(description='PQC Bridge')
    parser.add_argument('--mode', choices=['server', 'cli'], default='server', help='Run mode')
    parser.add_argument('--port', type=int, default=5001, help='Server port')
    
    args = parser.parse_args()
    
    if args.mode == 'server':
        app.run(host='0.0.0.0', port=args.port, debug=False)
    elif args.mode == 'cli':
        # CLI mode for direct node.js integration
        if len(sys.argv) < 3:
            print("Usage: python pqc_bridge.py cli <method> [args...]")
            sys.exit(1)
        
        method = sys.argv[2]
        
        try:
            if method == 'generate_kyber_keypair':
                result = pqc.generate_kyber_keypair()
            elif method == 'generate_dilithium_keypair':
                result = pqc.generate_dilithium_keypair()
            elif method == 'create_challenge':
                result = pqc.create_challenge(sys.argv[3])
            elif method == 'dilithium_sign':
                result = pqc.dilithium_sign(sys.argv[3], sys.argv[4])
            elif method == 'dilithium_verify':
                result = pqc.dilithium_verify(sys.argv[3], sys.argv[4], sys.argv[5])
            else:
                raise ValueError(f"Unknown method: {method}")
            
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

if __name__ == '__main__':
    main()