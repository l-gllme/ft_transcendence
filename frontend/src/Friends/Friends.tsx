import React from "react";
import FriendList from "./FriendList";

export default function Friends() {
    return (
        <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-4 md:mt-0">
          <FriendList />
        </div>
      );
}