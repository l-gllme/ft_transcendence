import React, { useState } from "react";
import Logout from "./Logout";

const TwoFA: React.FC = () => {
  const [code2FA, setCode2FA] = useState("");

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode2FA(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:4000/auth/2fa/check", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code2FA }),
      });

      if (response.ok) {
        window.location.href = "/settings";
      } else {
        alert("2FA code is invalid");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <input
        className="border border-gray-300 rounded px-4 py-2 mb-4"
        type="text"
        placeholder="Enter 2FA code"
        value={code2FA}
        onChange={handleCodeChange}
      />
      <button
        className="bg-blue-500 hover:bg-blue-600 text-amber-50 font-bold py-2 px-4 rounded"
        onClick={handleSubmit}
      >
        Submit
      </button>
      <Logout />
    </div>
  );
};

export default TwoFA;
