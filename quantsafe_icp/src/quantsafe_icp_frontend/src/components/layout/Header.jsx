import React from 'react';

const Header = () => {
    return (
        <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <h1 className="font-cookie text-3xl">AI-PQC Social Media</h1>
            <nav>
                <ul className="flex space-x-4">
                    <li>
                        <a href="/" className="hover:text-gray-400 transition">Home</a>
                    </li>
                    <li>
                        <a href="/dashboard" className="hover:text-gray-400 transition">Dashboard</a>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;