import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <p className="font-cookie text-lg">© {new Date().getFullYear()} AI-PQC Social Media. All rights reserved.</p>
                <div className="mt-2">
                    <a href="/privacy" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</a>
                    <span className="mx-2">|</span>
                    <a href="/terms" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;