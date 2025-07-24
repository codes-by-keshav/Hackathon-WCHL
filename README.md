# QuantaVerse 🚀

**The World's First Quantum-Resistant Social Media Platform**

QuantaVerse is a revolutionary social media platform built on the Internet Computer Protocol (ICP) blockchain that addresses the critical vulnerability of traditional blockchain systems to quantum computing attacks. While most blockchains claim security through cryptography, they rely on ECDSA which is vulnerable to quantum attacks. QuantaVerse fills this gap by implementing Post-Quantum Cryptography (PQC) algorithms.

## 🎯 Problem Statement

Current blockchain systems use ECDSA (Elliptic Curve Digital Signature Algorithm) which, while secure against classical computers, can be broken by sufficiently powerful quantum computers using Shor's algorithm. This poses a significant threat to the security of blockchain networks and user data.

## 🛡️ Our Solution

QuantaVerse implements **Post-Quantum Cryptography** using:
- **Kyber512**: For quantum-resistant key encapsulation
- **Dilithium2**: For quantum-resistant digital signatures

This ensures our platform remains secure even in the post-quantum era.

## 🎥 Demo

[![QuantaVerse Demo](https://img.shields.io/badge/Watch-Demo%20Video-red?style=for-the-badge&logo=youtube)](YOUTUBE_DEMO_LINK_HERE)

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        QuantaVerse Platform                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │   Web Browser   │    │   ICP Blockchain │    │   Backend   │  │
│  │                 │    │                  │    │   Server    │  │
│  │ ┌─────────────┐ │    │ ┌──────────────┐ │    │             │  │
│  │ │Web Extension│ │    │ │   Frontend   │ │    │  ┌────────┐ │  │
│  │ │             │ │    │ │   Canister   │ │    │  │Node.js │ │  │
│  │ │┌───────────┐│ │    │ │              │ │    │  │Express │ │  │
│  │ ││AES-256    ││ │    │ └──────────────┘ │    │  └────────┘ │  │
│  │ ││Encrypted  ││ │    │                  │    │             │  │
│  │ ││Private    ││ │    │                  │    │             │  │
│  │ ││Keys       ││ │    │                  │    │             │  │
│  │ │└───────────┘│ │    │                  │    │             │  │
│  │ └─────────────┘ │    │                  │    │             │  │ 
│  └─────────────────┘    └──────────────────┘    └─────────────┘  │ 
│           │                       │                      │       │
│           └───────────────────────┼──────────────────────┘       │
│                                   │                              │
│                                   ▼                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                PQC Microservice (Python)                    │ │
│  │                                                             │ │
│  │  ┌─────────────┐              ┌─────────────────────────┐   │ │
│  │  │   Flask     │              │       liboqs            │   │ │
│  │  │   Server    │◄────────────►│                         │   │ │
│  │  │             │              │  ┌─────────┐ ┌────────┐ │   │ │
│  │  └─────────────┘              │  │Kyber512 │ │Dilithium2│   │ │ 
│  │                               │  │   KEM   │ │   DSA  │ │   │ │
│  │                               │  └─────────┘ └────────┘ │   │ │
│  │                               └─────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

Authentication Flow:
1. User Registration → Generate PQC Keypairs → Store Private Keys (AES-256)
2. User Login → Create Challenge → Sign with Private Key → Verify Signature
3. Passwordless & Quantum-Resistant Authentication ✅
```

## 🔐 Passwordless Authentication Flow

1. **Registration**: User enters username/email → System generates Kyber512 & Dilithium2 keypairs → Private keys stored in browser extension with AES-256 encryption
2. **Login**: User enters email/username → Backend creates cryptographic challenge → Extension retrieves & decrypts private keys → Signs challenge → Backend verifies signature
3. **Security**: Private keys never leave the user's device and remain encrypted at rest

## 🛠️ Tech Stack

### Frontend
- **Deployment**: Internet Computer Protocol (ICP) Blockchain
- **Framework**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Custom Web Extension

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: User management and authentication
- **APIs**: RESTful API design

### Post-Quantum Cryptography
- **Language**: Python
- **Framework**: Flask (Microservice Architecture)
- **Library**: liboqs-python (Open Quantum Safe)
- **Algorithms**: 
  - Kyber512 (Key Encapsulation Mechanism)
  - Dilithium2 (Digital Signature Algorithm)

### Browser Extension
- **Storage**: AES-256 encrypted local storage
- **Purpose**: Secure private key management

## 🚀 Getting Started

### Prerequisites
- Node.js and npm
- Python 3.x
- DFX (Internet Computer SDK)
- Modern web browser with developer mode

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/codes-by-keshav/Hackathon-WCHL.git
   ```

2. **Deploy Frontend to ICP**
    Navigate to `scripts` directory 
   ```bash
   ./deploy-icp-frontend.sh
   ```

3. **Setup Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

4. **Setup PQC Microservice**
    Install the `liboqs-python` lib from [libqos-python](https://github.com/open-quantum-safe/liboqs-python)
    Then execute these commands:

   ```bash
   cd pqc/src
   pip install -r requirements.txt
   python src/pqc_bridge.py
   ```

5. **Install Browser Extension**
   - Open your browser's extension management page
   - Enable Developer Mode
   - Load unpacked extension from the `extension/` directory

## 👥 Team

| Name | GitHub |
|------|--------|
| [Keshav] | [codes-by-keshav](https://github.com/codes-by-keshav) |
| [Yashasvi] | [yashasviCodes](https://github.com/yashasviCodes) |

## 🔮 Future Roadmap

### Phase 1: Enhanced User Experience
- Complete user dashboard and social feed
- Real-time messaging system
- Content creation tools add monetization for creators

### Phase 2: AI-Powered Features
- **Sentiment Detection**: Promote positive content to users showing signs of negative sentiment patterns
- **Advanced Spam Detection**: ML-powered bot and spam prevention
- **Multilingual Hate Speech Detection**: 
  - Regional language support beyond English
  - Detection of clever wordplay and character substitutions (e.g., "b1tch" for "bitch")
  - Context-aware hate speech identification

### Phase 3: Advanced Security
- Multi-signature quantum-resistant transactions
- Zero-knowledge proof integration
- Enhanced privacy features

## 🔒 Security Features

- **Quantum-Resistant Cryptography**: Kyber512 + Dilithium2
- **Passwordless Authentication**: No passwords to be compromised
- **Local Key Storage**: Private keys never leave user's device
- **AES-256 Encryption**: Additional layer of protection for stored keys
- **Blockchain Immutability**: Leveraging ICP's security guarantees

## 🌐 Why This Matters

As quantum computing advances, traditional cryptographic methods will become obsolete. QuantaVerse ensures that social media platforms can remain secure in the post-quantum era, protecting user privacy and data integrity against future quantum attacks.



## ⭐ Star Us

If you find QuantaVerse interesting, please give us a star! It helps us reach more developers interested in quantum-resistant technologies.

---

# <center>Built with 🧠 & ❤️</center>