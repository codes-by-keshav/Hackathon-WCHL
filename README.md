# QuantaVerse 🚀

**The World's First Quantum-Resistant Social Media Platform**

QuantaVerse is a revolutionary social media platform built on the Internet Computer Protocol (ICP) blockchain that addresses the critical vulnerability of traditional blockchain systems to quantum computing attacks. While most blockchains claim security through cryptography, they rely on ECDSA which is vulnerable to quantum attacks. QuantaVerse fills this gap by implementing Post-Quantum Cryptography (PQC) algorithms.


## HomePage
<img width="1920" height="1076" alt="Screenshot From 2025-07-25 01-27-28" src="https://github.com/user-attachments/assets/6e6e3829-e647-41a7-8e20-f2be3c1471da" />

## Feed 1
<img width="1901" height="866" alt="Screenshot 2025-08-22 014028" src="https://github.com/user-attachments/assets/23a8c0e3-0c79-4b5c-89db-b2ac4a050466" />

## Feed 2
<img width="1897" height="861" alt="Screenshot 2025-08-22 014104" src="https://github.com/user-attachments/assets/c644037b-8b69-408c-aefa-57eb55f78fdc" />

## Feed 3
<img width="1900" height="858" alt="Screenshot 2025-08-22 014204" src="https://github.com/user-attachments/assets/eaf7bc79-8d34-4698-8b36-02d5ed2ac6ed" />

## Commenting on Posts
<img width="1408" height="857" alt="Screenshot 2025-08-22 014137" src="https://github.com/user-attachments/assets/95e32b51-d6d8-42b6-b199-e72e950dc4ea" />

## Creating a post
<img width="1377" height="850" alt="Screenshot 2025-08-22 014302" src="https://github.com/user-attachments/assets/f76230d2-a9e5-4788-ab80-bce8f529ea21" />


## 🎯 Problem Statement

Current blockchain systems use ECDSA (Elliptic Curve Digital Signature Algorithm) which, while secure against classical computers, can be broken by sufficiently powerful quantum computers using Shor's algorithm. This poses a significant threat to the security of blockchain networks and user data.

## 🛡️ Our Solution

QuantaVerse implements **Post-Quantum Cryptography** using:
- **Kyber512**: For quantum-resistant key encapsulation
- **Dilithium2**: For quantum-resistant digital signatures

This ensures our platform remains secure even in the post-quantum era.

## 🎥 Demo

[![QuantaVerse Demo](https://img.shields.io/badge/Watch-Demo%20Video-red?style=for-the-badge&logo=youtube)](https://youtu.be/1hvRx8BrWV8)

[![QuantaVerse PPT](https://img.shields.io/badge/View-Presentation-blue?style=for-the-badge&logo=microsoftpowerpoint)](https://docs.google.com/presentation/d/1xH5ez_PYmC9uwfU_s2NwZqnBChf1ilNv7WizVkC7yaA/edit?usp=sharing)



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

2. **Install Browser Extension**
   - Open your browser's extension management page
   - Enable Developer Mode
   - Load unpacked extension from the `extension/` directory

3. **Setup Backend**
(Should have MongoDD installed)
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
5. **Deploy Frontend to ICP**
    Navigate to `scripts` directory 
   ```bash
   ./deploy-icp-frontend.sh
   ```
   - The script will automatically install npm packages for frontend too no need to install them earlier.


### Usage
1. Open the URL genrated upon deploying the frontend on ICP Blockchain or directly open `http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/`
2. Now click on the installed browser extension icon to open it
3. Register as a new User. After successfull registeration go back to Login screen in the extension and use your username/email to login.
4. Browse your social media feed, interact and have fun.


## 👥 Team

| Name | GitHub |
|------|--------|
| [Keshav] | [codes-by-keshav](https://github.com/codes-by-keshav) |
| [Yashasvi] | [yashasviCodes](https://github.com/yashasviCodes) |

## 🔮 Future Roadmap

### Phase 1: Enhanced User Experience (✅ Completed)
- Complete user dashboard and social feed
- Content creation tools

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
